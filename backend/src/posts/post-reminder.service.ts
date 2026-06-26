import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PostStatus } from '@prisma/client';
import { FirebaseService } from '../firebase/firebase.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PostReminderService {
  private readonly logger = new Logger(PostReminderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Cron('0 0 9 * * *', {
    timeZone: 'Asia/Damascus',
  })
  async sendTodayEventReminders(): Promise<void> {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const posts = await this.prisma.post.findMany({
      where: {
        isPublished: true,
        status: PostStatus.published,
        reminderSentAt: null,
        eventDate: { gte: startOfToday, lte: endOfToday },
      },
      select: {
        id: true,
        title: true,
        eventTime: true,
      },
    });

    if (!posts.length) {
      this.logger.log('No event reminders to send today.');
      return;
    }

    const sentPostIds: string[] = [];
    let successCount = 0;

    for (const post of posts) {
      try {
        const messageId = await this.firebaseService.sendToTopic(
          'client',
          `Live event today at ${post.eventTime || 'the scheduled time'}`,
          post.title,
          { postId: post.id },
        );

        sentPostIds.push(post.id);
        successCount += 1;
        this.logger.log(
          `Reminder sent for post ${post.id} (messageId: ${messageId})`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send reminder for post ${post.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    if (sentPostIds.length > 0) {
      await this.prisma.post.updateMany({
        where: { id: { in: sentPostIds } },
        data: { reminderSentAt: new Date(), updatedAt: new Date() },
      });
    }

    this.logger.log(
      `Reminder job complete. Sent: ${successCount}, Failed: ${posts.length - successCount}`,
    );
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class PostReminderService {
  private readonly logger = new Logger(PostReminderService.name);

  constructor(
    @InjectModel(Post.name)
    private readonly postModel: Model<PostDocument>,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Cron('0 0 9 * * *', {
    timeZone: 'Asia/Damascus',
  })
  async sendTodayEventReminders() {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const posts = await this.postModel.find({
      isPublished: true,
      $or: [{ reminderSentAt: null }, { reminderSentAt: { $exists: false } }],
      eventDate: { $gte: startOfToday, $lte: endOfToday },
    });

    if (!posts.length) {
      this.logger.log('No event reminders to send today.');
      return;
    }

    const sentPostIds: PostDocument['_id'][] = [];
    let successCount = 0;

    for (const post of posts) {
      try {
        const messageId = await this.firebaseService.sendToTopic(
          'client',
          `Մնացէք մեզի հետ, ժամը ${post.eventTime}-ին:`,
          `${post.title}`,
          { postId: post._id.toString() },
        );

        sentPostIds.push(post._id);
        successCount += 1;
        this.logger.log(
          `Reminder sent for post ${post._id.toString()} (messageId: ${messageId})`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send reminder for post ${post._id.toString()}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    if (sentPostIds.length > 0) {
      await this.postModel.updateMany(
        { _id: { $in: sentPostIds } },
        { $set: { reminderSentAt: new Date() } },
      );
    }

    this.logger.log(
      `Reminder job complete. Sent: ${successCount}, Failed: ${posts.length - successCount}`,
    );
  }
}

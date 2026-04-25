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
    timeZone: 'Asia/Damascus', // change to your app timezone
  })
  async sendTodayEventReminders() {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // find posts that are published, not yet sent, and eventDate is later today
    const posts = await this.postModel.find({
      isPublished: true,
      reminderSentAt: null,
      eventDate: { $gte: startOfToday, $lte: endOfToday },
    });

    if (!posts.length) {
      this.logger.log('No event reminders to send today.');
      return;
    }

    try {
       for (const post of posts) {
        await this.firebaseService.sendToTopic(
            'client',
          `Մնացեք մեզի հետ ժամը ${post.eventTime}-ին։`,
          `${post.title}`,
          { postId: post._id.toString() },
        );
      }
      this.logger.log(`Sent ${posts.length} reminder notifications.`);

      // mark all matching posts as sent in one go (or loop if you prefer)
      await this.postModel.updateMany(
        { _id: { $in: posts.map((p) => p._id) } },
        { $set: { reminderSentAt: new Date() } },
      );
    } catch (error) {
      this.logger.error('Failed to send event reminders', error);
      throw error;
    }
  }
}
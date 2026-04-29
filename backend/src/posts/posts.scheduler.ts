// src/posts/posts.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';

@Injectable()
export class PostsScheduler {
  private readonly logger = new Logger(PostsScheduler.name);

  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Asia/Damascus',
  })
  async unpublishOldEventPosts() {
    try {
      const now = new Date();
      const cutoff = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

      const result = await this.postModel.updateMany(
        {
          eventDate: { $lte: cutoff },
          isPublished: true,
        },
        {
          $set: {
            isPublished: false,
            isLive: false,
            status: 'expired',
            updatedAt: now,
          },
        },
      );

      this.logger.log(
        `Midnight event-date cleanup completed. Unpublished: ${result.modifiedCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Midnight event-date cleanup failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

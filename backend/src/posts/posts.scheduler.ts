// src/posts/posts.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { NotificationGateway } from '../notifications/notification.gateway';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PostsScheduler {
  private readonly logger = new Logger(PostsScheduler.name);

  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    private notificationGateway: NotificationGateway,
  ) {}

  // Runs every day at midnight
  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteExpiredPosts() {
    this.logger.log('🕐 Running expired posts cleanup...');

    try {
      const expiredPosts = await this.postModel
        .find({ expiresAt: { $lt: new Date() } })
        .exec();

      if (expiredPosts.length === 0) {
        this.logger.log('✅ No expired posts found');
        return;
      }

      this.logger.log(`🗑️ Found ${expiredPosts.length} expired posts`);

      for (const post of expiredPosts) {
        // Delete media files
        try {
          if (post.mainImage && post.mainImage.trim() !== '') {
            const imagePath = path.join(process.cwd(), post.mainImage);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
              this.logger.log(`✅ Deleted image: ${post.mainImage}`);
            }
          }
          if (post.video && post.video.trim() !== '') {
            const videoPath = path.join(process.cwd(), post.video);
            if (fs.existsSync(videoPath)) {
              fs.unlinkSync(videoPath);
              this.logger.log(`✅ Deleted video: ${post.video}`);
            }
          }
        } catch (e) {
          this.logger.error(`Media delete error for post ${post._id}:`, e);
        }

        // Delete post from DB
        await this.postModel.findByIdAndDelete(post._id);
        this.logger.log(`✅ Deleted expired post: ${post.title}`);

        // Notify admins
        try {
          await this.notificationGateway.emitPostDeleted(
            post.title,
            'System (Auto Cleanup)',
          );
        } catch (e) {
          this.logger.error('Notification error:', e);
        }
      }

      this.logger.log(`✅ Cleanup done — deleted ${expiredPosts.length} posts`);
    } catch (error) {
      this.logger.error('❌ Expired posts cleanup failed:', error);
    }
  }
}

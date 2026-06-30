// src/posts/posts.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PostsService } from './posts.service';

@Injectable()
export class PostsScheduler {
  private readonly logger = new Logger(PostsScheduler.name);

  constructor(private readonly postsService: PostsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Asia/Damascus',
  })
  async unpublishExpiredPosts(): Promise<void> {
    try {
      const expiredCount = await this.postsService.expirePostsPastExpiryDate();

      this.logger.log(
        `Midnight post-expiry cleanup completed. Unpublished: ${expiredCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Midnight post-expiry cleanup failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

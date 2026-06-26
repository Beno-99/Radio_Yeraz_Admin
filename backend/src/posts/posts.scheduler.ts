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
  async unpublishOldEventPosts(): Promise<void> {
    try {
      const expiredCount = await this.postsService.expirePostsPastEventWindow();

      this.logger.log(
        `Midnight event-date cleanup completed. Unpublished: ${expiredCount}`,
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

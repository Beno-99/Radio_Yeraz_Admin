// src/posts/posts.module.ts
import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { NotificationModule } from 'src/notifications/notification.module';
import { PostsScheduler } from './posts.scheduler';
import { ScheduleModule } from '@nestjs/schedule';
import { PostReminderService } from './post-reminder.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NotificationModule,
    PrismaModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsScheduler,PostReminderService],
  exports: [PostsService],
})
export class PostsModule {}

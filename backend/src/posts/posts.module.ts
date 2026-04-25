// src/posts/posts.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { Post, PostSchema } from './schemas/post.schema';
import { Admin, AdminSchema } from '../admin/schemas/admin.schema';
import { NotificationModule } from 'src/notifications/notification.module';
import { PostsScheduler } from './posts.scheduler';
import { ScheduleModule } from '@nestjs/schedule';
import { PostReminderService } from './post-reminder.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    NotificationModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, PostsScheduler,PostReminderService],
  exports: [PostsService, MongooseModule],
})
export class PostsModule {}

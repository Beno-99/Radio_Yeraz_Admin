// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Admin, AdminSchema } from './schemas/admin.schema';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SeedService } from './seed.service';
import { PostsModule } from 'src/posts/posts.module';
import { AdsModule } from 'src/ads/ads.module';
import { Post, PostSchema } from 'src/posts/schemas/post.schema';
import { Ad, AdSchema } from 'src/ads/schemas/ad.schema';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Admin.name, schema: AdminSchema },
      { name: Post.name, schema: PostSchema },
      { name: Ad.name, schema: AdSchema },
    ]),
    PostsModule,
    AdsModule,
    AuthModule,
    NotificationModule, // ← ADDED
  ],
  controllers: [AdminController],
  providers: [AdminService, SeedService],
  exports: [AdminService],
})
export class AdminModule {}

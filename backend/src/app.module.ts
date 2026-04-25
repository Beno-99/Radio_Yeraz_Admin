// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { AdsModule } from './ads/ads.module';
import { UploadModule } from './upload/upload.module';
import { NotificationModule } from './notifications/notification.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FirebaseModule } from './firebase/firebase.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    UploadModule,
    DatabaseModule,
    AuthModule,
    AdminModule,
    PostsModule,
    AdsModule,
    NotificationModule,
    FirebaseModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}

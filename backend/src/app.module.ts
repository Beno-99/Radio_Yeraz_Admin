// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { CarouselsModule } from './carousels/carousels.module';
import { UploadModule } from './upload/upload.module';
import { NotificationModule } from './notifications/notification.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FirebaseModule } from './firebase/firebase.module';
import { StreamLinkModule } from './stream-link/stream-link.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    UploadModule,
    DatabaseModule.forRoot(),
    AuthModule,
    AdminModule,
    PostsModule,
    CarouselsModule,
    NotificationModule,
    FirebaseModule,
    StreamLinkModule,
    ScheduleModule.forRoot(),
  ],
})
export class AppModule {}

// src/ads/ads.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { Ad, AdSchema } from './schemas/ad.schema';
import { Admin, AdminSchema } from '../admin/schemas/admin.schema';
import { NotificationModule } from '../notifications/notification.module';
import { AdsScheduler } from './ads.scheduler';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Ad.name, schema: AdSchema },
      { name: Admin.name, schema: AdminSchema },
    ]),
    NotificationModule,
  ],
  controllers: [AdsController],
  providers: [AdsService, AdsScheduler],
  exports: [AdsService, MongooseModule],
})
export class AdsModule {}

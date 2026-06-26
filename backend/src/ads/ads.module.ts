// src/ads/ads.module.ts
import { Module } from '@nestjs/common';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';
import { NotificationModule } from '../notifications/notification.module';
import { AdsScheduler } from './ads.scheduler';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [NotificationModule, PrismaModule],
  controllers: [AdsController],
  providers: [AdsService, AdsScheduler],
  exports: [AdsService],
})
export class AdsModule {}

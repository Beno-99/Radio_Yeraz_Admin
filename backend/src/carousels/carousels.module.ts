// src/carousels/carousels.module.ts
import { Module } from '@nestjs/common';
import { CarouselsController } from './carousels.controller';
import { CarouselsService } from './carousels.service';
import { NotificationModule } from '../notifications/notification.module';
import { CarouselsScheduler } from './carousels.scheduler';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [NotificationModule, PrismaModule],
  controllers: [CarouselsController],
  providers: [CarouselsService, CarouselsScheduler],
  exports: [CarouselsService],
})
export class CarouselsModule {}

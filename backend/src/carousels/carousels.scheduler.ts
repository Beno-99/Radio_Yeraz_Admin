// src/carousels/carousels.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CarouselsService } from './carousels.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class CarouselsScheduler {
  private readonly logger = new Logger(CarouselsScheduler.name);

  constructor(
    private readonly carouselsService: CarouselsService,
    private readonly notificationGateway: NotificationGateway,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Asia/Damascus',
  })
  async syncCarouselStatuses(): Promise<void> {
    await this.carouselsService.syncLifecycleStatuses();
    this.logger.log('Carousels lifecycle statuses synced successfully.');
  }

  @Cron('0 9 * * *')
  async checkExpiringCarousels(): Promise<void> {
    this.logger.log('Checking for expiring carousels...');

    try {
      const now = new Date();
      const in3Days = new Date();
      in3Days.setDate(now.getDate() + 3);

      const expiringCarousels = await this.carouselsService.findExpiringCarousels(
        now,
        in3Days,
      );

      if (expiringCarousels.length === 0) {
        this.logger.log('No expiring carousels found');
        return;
      }

      this.logger.log(`Found ${expiringCarousels.length} expiring carousels`);

      for (const carousel of expiringCarousels) {
        if (!carousel.endDate) continue;

        const endDate = new Date(carousel.endDate);
        const daysLeft = Math.ceil(
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const alreadyNotified = await this.notificationService.findCarouselTodayExpiry(
          carousel._id,
          todayStart,
        );

        if (alreadyNotified) {
          this.logger.log(`Already notified today for: "${carousel.name}"`);
          continue;
        }

        this.logger.log(`Carousel "${carousel.name}" expires in ${daysLeft} day(s)`);
        await this.notificationGateway.emitCarouselExpiringSoon(carousel, daysLeft);
      }
    } catch (error) {
      this.logger.error(
        `Expiring carousels check failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

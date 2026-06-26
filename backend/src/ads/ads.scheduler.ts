// src/ads/ads.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AdsService } from './ads.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class AdsScheduler {
  private readonly logger = new Logger(AdsScheduler.name);

  constructor(
    private readonly adsService: AdsService,
    private readonly notificationGateway: NotificationGateway,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'Asia/Damascus',
  })
  async syncAdStatuses(): Promise<void> {
    await this.adsService.syncLifecycleStatuses();
    this.logger.log('Ads lifecycle statuses synced successfully.');
  }

  @Cron('0 9 * * *')
  async checkExpiringAds(): Promise<void> {
    this.logger.log('Checking for expiring ads...');

    try {
      const now = new Date();
      const in3Days = new Date();
      in3Days.setDate(now.getDate() + 3);

      const expiringAds = await this.adsService.findExpiringAds(now, in3Days);

      if (expiringAds.length === 0) {
        this.logger.log('No expiring ads found');
        return;
      }

      this.logger.log(`Found ${expiringAds.length} expiring ads`);

      for (const ad of expiringAds) {
        if (!ad.endDate) continue;

        const endDate = new Date(ad.endDate);
        const daysLeft = Math.ceil(
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const alreadyNotified = await this.notificationService.findTodayExpiry(
          ad._id,
          todayStart,
        );

        if (alreadyNotified) {
          this.logger.log(`Already notified today for: "${ad.name}"`);
          continue;
        }

        this.logger.log(`Ad "${ad.name}" expires in ${daysLeft} day(s)`);
        await this.notificationGateway.emitAdExpiringSoon(ad, daysLeft);
      }
    } catch (error) {
      this.logger.error(
        `Expiring ads check failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}

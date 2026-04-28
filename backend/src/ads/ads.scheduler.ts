// src/ads/ads.scheduler.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ad, AdDocument } from './schemas/ad.schema';
import { NotificationGateway } from '../notifications/notification.gateway';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class AdsScheduler {
  private readonly logger = new Logger(AdsScheduler.name);

  constructor(
    @InjectModel(Ad.name) private adModel: Model<AdDocument>,
    private notificationGateway: NotificationGateway,
    private notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async syncAdStatuses() {
    const now = new Date();

    const activateResult = await this.adModel.updateMany(
      {
        startDate: { $lte: now },
        endDate: { $gte: now },
        isActive: { $ne: true },
      },
      {
        $set: { isActive: true, updatedAt: now },
      },
    );

    const deactivateResult = await this.adModel.updateMany(
      {
        $or: [
          { startDate: { $gt: now } },
          { endDate: { $gt: now } },
        ],
        isActive: { $ne: false },
      },
      {
        $set: { isActive: false, updatedAt: now },
      },
    );

    this.logger.log(
      `Ads synced. Activated: ${activateResult.modifiedCount}, Deactivated: ${deactivateResult.modifiedCount}`,
    );
  }

  @Cron('0 9 * * *')
  async checkExpiringAds() {
    this.logger.log('🕐 Checking for expiring ads...');

    try {
      const now = new Date();
      const in3Days = new Date();
      in3Days.setDate(now.getDate() + 3);

      const expiringAds = await this.adModel
        .find({
          isActive: true,
          endDate: { $gte: now, $lte: in3Days },
        })
        .exec();

      if (expiringAds.length === 0) {
        this.logger.log('✅ No expiring ads found');
        return;
      }

      this.logger.log(`⚠️ Found ${expiringAds.length} expiring ads`);

      for (const ad of expiringAds) {
        const endDate = new Date(ad.endDate);
        const daysLeft = Math.ceil(
          (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const alreadyNotified = await this.notificationService.findTodayExpiry(
          ad._id.toString(),
          todayStart,
        );

        if (alreadyNotified) {
          this.logger.log(`⏭️ Already notified today for: "${ad.name}"`);
          continue;
        }

        this.logger.log(`⚠️ Ad "${ad.name}" expires in ${daysLeft} day(s)`);
        await this.notificationGateway.emitAdExpiringSoon(ad, daysLeft);
      }
    } catch (error) {
      this.logger.error('❌ Expiring ads check failed:', error);
    }
  }
}

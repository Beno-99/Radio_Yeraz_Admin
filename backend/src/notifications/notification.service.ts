// src/notifications/notification.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CronJob } from 'cron';                    // ← Important
import { SchedulerRegistry } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly retentionDays: number;

  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
    private configService: ConfigService,
    private schedulerRegistry: SchedulerRegistry,
  ) {
    this.retentionDays = this.configService.get<number>('NOTIFICATION_RETENTION_DAYS') || 30;
  }

  onModuleInit() {
    const minute = this.configService.get<string>('NOTIFICATION_CRON_MINUTE') || '0';
    const hour = this.configService.get<string>('NOTIFICATION_CRON_HOUR') || '3';
    const dayInterval = this.configService.get<string>('NOTIFICATION_CRON_DAY_INTERVAL') || '10';

    const cronExpression = `${minute} ${hour} */${dayInterval} * *`;

    console.log(`🕒 Notification cleanup scheduled with expression: ${cronExpression}`);

    const job = new CronJob(
      cronExpression,
      () => this.cleanupOldNotifications(),
      null,
      true,
      'Asia/Karachi' // ← Change to your timezone if needed
    );

    this.schedulerRegistry.addCronJob('notification-cleanup', job);
    job.start();
  }

  // ====================== Cleanup Logic ======================
  async cleanupOldNotifications() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      const result = await this.notificationModel.deleteMany({
        createdAt: { $lt: cutoffDate },
      });

      if (result.deletedCount > 0) {
        console.log(`🧹 [Notification Cron] ${result.deletedCount} notifications cleaned (older than ${this.retentionDays} days)`);
      } else {
        console.log(`🧹 [Notification Cron] No old notifications to clean`);
      }
    } catch (error) {
      console.error('❌ [Notification Cron] Failed:', error);
    }
  }

  // ====================== Other Methods ======================

  async create(data: {
    title: string;
    message: string;
    type: NotificationType;
    postId?: string;
    authorName?: string;
    data?: Record<string, any>;
  }): Promise<NotificationDocument> {
    const notification = new this.notificationModel(data);
    return notification.save();
  }

  async findAll(limit = 20): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  async getUnreadCount(): Promise<number> {
    return this.notificationModel.countDocuments({ isRead: false }).exec();
  }

  async markAllAsRead(): Promise<void> {
    await this.notificationModel.updateMany(
      { isRead: false },
      { isRead: true },
    );
  }

  async findTodayExpiry(adId: string, todayStart: Date): Promise<boolean> {
    const existing = await this.notificationModel.findOne({
  type: NotificationType.AD_EXPIRING,
  'data.adId': adId,
  createdAt: { $gte: todayStart },
});
    return !!existing;
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationModel.findByIdAndUpdate(id, { isRead: true });
  }

  async deleteAll(): Promise<void> {
    await this.notificationModel.deleteMany({});
  }

  async deleteOne(id: string): Promise<void> {
    await this.notificationModel.findByIdAndDelete(id);
  }
}
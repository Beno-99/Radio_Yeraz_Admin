// src/notifications/notification.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationDocument,
  NotificationType,
} from './schemas/notification.schema';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<NotificationDocument>,
  ) {}

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
      type: 'AD_EXPIRING',
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
}

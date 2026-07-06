// src/notifications/notification.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import {
  Notification as PrismaNotification,
  NotificationType,
  Prisma,
} from '@prisma/client';
import { CronJob } from 'cron';
import { createObjectIdString } from '../common/utils/object-id.utils';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificationCreateData {
  title: string;
  message: string;
  type: NotificationType;
  postId?: string;
  authorName?: string;
  data?: Prisma.InputJsonValue;
}

export interface NotificationResponse
  extends Omit<PrismaNotification, 'data'> {
  _id: string;
  data: Prisma.JsonValue | null;
  __v: number;
}

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly retentionDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.retentionDays =
      this.configService.get<number>('NOTIFICATION_RETENTION_DAYS') || 30;
  }

  onModuleInit(): void {
    const minute =
      this.configService.get<string>('NOTIFICATION_CRON_MINUTE') || '0';
    const hour =
      this.configService.get<string>('NOTIFICATION_CRON_HOUR') || '3';
    const dayInterval =
      this.configService.get<string>('NOTIFICATION_CRON_DAY_INTERVAL') || '10';

    const cronExpression = `${minute} ${hour} */${dayInterval} * *`;

    console.log(
      `Notification cleanup scheduled with expression: ${cronExpression}`,
    );

    const job = new CronJob(
      cronExpression,
      () => this.cleanupOldNotifications(),
      null,
      true,
      'Asia/Karachi',
    );

    this.schedulerRegistry.addCronJob('notification-cleanup', job);
    job.start();
  }

  private toNotificationResponse(
    notification: PrismaNotification,
  ): NotificationResponse {
    return {
      ...notification,
      _id: notification.id,
      __v: 0,
    };
  }

  private isJsonObject(
    value: Prisma.JsonValue | null,
  ): value is Prisma.JsonObject {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private getActorIdFromData(data: Prisma.JsonValue | null): string | null {
    if (!this.isJsonObject(data)) return null;

    const actorId = data.actorId;
    return typeof actorId === 'string' && actorId.trim() !== ''
      ? actorId
      : null;
  }

  private isVisibleToAdmin(
    notification: Pick<PrismaNotification, 'data'>,
    adminId?: string,
  ): boolean {
    if (!adminId) return true;

    return this.getActorIdFromData(notification.data) !== adminId;
  }

  async cleanupOldNotifications(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

      const result = await this.prisma.notification.deleteMany({
        where: { createdAt: { lt: cutoffDate } },
      });

      if (result.count > 0) {
        console.log(
          `[Notification Cron] ${result.count} notifications cleaned (older than ${this.retentionDays} days)`,
        );
      } else {
        console.log('[Notification Cron] No old notifications to clean');
      }
    } catch (error) {
      console.error('[Notification Cron] Failed:', error);
    }
  }

  async create(data: NotificationCreateData): Promise<NotificationResponse> {
    const notification = await this.prisma.notification.create({
      data: {
        id: createObjectIdString(),
        title: data.title,
        message: data.message,
        type: data.type,
        postId: data.postId,
        authorName: data.authorName,
        data: data.data ?? Prisma.JsonNull,
      },
    });

    return this.toNotificationResponse(notification);
  }

  async findAll(limit = 20): Promise<NotificationResponse[]> {
    const notifications = await this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return notifications.map((notification) =>
      this.toNotificationResponse(notification),
    );
  }

  async findAllForAdmin(
    adminId: string,
    limit = 20,
  ): Promise<NotificationResponse[]> {
    const requestedLimit = Math.max(1, limit);
    const pageSize = Math.min(Math.max(requestedLimit * 5, requestedLimit), 250);
    const visibleNotifications: NotificationResponse[] = [];
    let skip = 0;

    while (visibleNotifications.length < requestedLimit) {
      const batch = await this.prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      });

      if (batch.length === 0) break;

      visibleNotifications.push(
        ...batch
          .filter((notification) => this.isVisibleToAdmin(notification, adminId))
          .map((notification) => this.toNotificationResponse(notification)),
      );

      skip += batch.length;
      if (batch.length < pageSize) break;
    }

    return visibleNotifications.slice(0, requestedLimit);
  }

  async getUnreadCount(): Promise<number> {
    return this.prisma.notification.count({ where: { isRead: false } });
  }

  async getUnreadCountForAdmin(adminId: string): Promise<number> {
    const unreadNotifications = await this.prisma.notification.findMany({
      where: { isRead: false },
      select: { data: true },
    });

    return unreadNotifications.filter((notification) =>
      this.isVisibleToAdmin(notification, adminId),
    ).length;
  }

  async markAllAsRead(): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true, updatedAt: new Date() },
    });
  }

  async findCarouselTodayExpiry(
    carouselId: string,
    todayStart: Date,
  ): Promise<boolean> {
    const notifications = await this.prisma.notification.findMany({
      where: {
        type: NotificationType.CAROUSEL_EXPIRING,
        createdAt: { gte: todayStart },
      },
      select: { data: true },
    });

    return notifications.some((notification) => {
      const data = notification.data;
      return this.isJsonObject(data) && data.carouselId === carouselId;
    });
  }

  async markAsRead(id: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id },
      data: { isRead: true, updatedAt: new Date() },
    });
  }

  async deleteAll(): Promise<void> {
    await this.prisma.notification.deleteMany();
  }

  async deleteOne(id: string): Promise<void> {
    await this.prisma.notification.deleteMany({ where: { id } });
  }
}

// src/notifications/notification.controller.ts
import { Controller, Get, Put, Param, Delete, Query } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getAll(@Query('limit') limit: string = '20') {
    const limitNum = parseInt(limit, 10) || 20;
    const notifications = await this.notificationService.findAll(limitNum);
    const unreadCount = await this.notificationService.getUnreadCount();
    return { success: true, data: notifications, unreadCount };
  }

  @Get('unread-count')
  async getUnreadCount() {
    const count = await this.notificationService.getUnreadCount();
    return { success: true, count };
  }

  @Put('mark-all-read')
  async markAllRead() {
    await this.notificationService.markAllAsRead();
    return { success: true, message: 'All notifications marked as read' };
  }

  @Put(':id/read')
  async markRead(@Param('id') id: string) {
    await this.notificationService.markAsRead(id);
    return { success: true };
  }

  @Delete('all')
  async deleteAll() {
    await this.notificationService.deleteAll();
    return { success: true, message: 'All notifications deleted' };
  }
}

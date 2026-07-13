// src/notifications/notification.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { NotificationService } from './notification.service';
import { FirebaseService } from '../firebase/firebase.service';
import { Role } from '../admin/schemas/admin.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Post('broadcast')
  async broadcastNotification(
    @Req() req: AuthenticatedRequest,
    @Body()
    body: {
      title?: string;
      message?: string;
      body?: string;
      link?: string;
      postId?: string;
    },
  ) {
    const title = body.title?.trim();
    const message = (body.message ?? body.body ?? '').trim();
    const link = body.link?.trim();
    const postId = body.postId?.trim();

    if (!title || !message) {
      throw new BadRequestException('Title and message are required');
    }

    const authorName = req.user.displayName || req.user.username || 'Admin';
    const historyData: Record<string, string> = {
      type: 'BROADCAST',
      action: 'broadcast_notification',
      sentByAdminId: req.user.sub,
      authorName,
    };

    if (link) {
      historyData.link = link;
    }

    if (postId) {
      historyData.postId = postId;
    }

    const notification = await this.notificationService.create({
      title,
      message,
      type: NotificationType.ADMIN_UPDATED,
      authorName,
      postId: postId || undefined,
      data: historyData,
    });

    let messageId: string;

    try {
      messageId = await this.firebaseService.sendToTopic(
        'client',
        title,
        message,
        {
          ...historyData,
          notificationId: notification._id,
          title,
          message,
        },
      );
    } catch (error) {
      await this.notificationService.deleteOne(notification._id);
      throw error;
    }

    return {
      success: true,
      message: 'Broadcast notification sent successfully',
      messageId,
      data: notification,
    };
  }

  @Get()
  async getAll(
    @Req() req: AuthenticatedRequest,
    @Query('limit') limit: string = '20',
  ) {
    const limitNum = parseInt(limit, 10) || 20;
    const notifications = await this.notificationService.findAllForAdmin(
      req.user.sub,
      limitNum,
    );
    const unreadCount = await this.notificationService.getUnreadCountForAdmin(
      req.user.sub,
    );
    return { success: true, data: notifications, unreadCount };
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req: AuthenticatedRequest) {
    const count = await this.notificationService.getUnreadCountForAdmin(
      req.user.sub,
    );
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

  @Delete(':id')
  async deleteOne(@Param('id') id: string) {
    await this.notificationService.deleteOne(id);
    return { success: true, message: 'Notification deleted successfully' };
  }

  @Post('test/device')
  async testDeviceNotification(
    @Body()
    body: { token: string; title?: string; body?: string; postId?: string },
  ) {
    const messageId = await this.firebaseService.sendToDevice(
      body.token,
      body.title || 'Device Test',
      body.body || 'Testing direct FCM delivery from backend',
      { postId: body.postId || 'test-post-id' },
    );

    return { success: true, messageId };
  }

  @Post('test/topic')
  async testTopicNotification(
    @Body() body: { topic?: string; title?: string; body?: string; postId?: string },
  ) {
    const messageId = await this.firebaseService.sendToTopic(
      body.topic || 'client',
      body.title || 'Topic Test',
      body.body || 'Testing topic FCM delivery from backend',
      { postId: body.postId || 'test-post-id' },
    );

    return { success: true, messageId };
  }

  @Post('test/subscribe-topic')
  async subscribeTokenToTopic(
    @Body() body: { token: string; topic?: string },
  ) {
    const response = await this.firebaseService.subscribeTokenToTopic(
      body.token,
      body.topic || 'client',
    );
    return { success: true, ...response };
  }
}

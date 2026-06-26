// src/notifications/notification.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { FirebaseService } from '../firebase/firebase.service';
import { Role } from '../admin/schemas/admin.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly firebaseService: FirebaseService,
  ) {}

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

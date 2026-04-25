// src/notifications/notification.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationService } from './notification.service';
import { NotificationType } from './schemas/notification.schema';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly notificationService: NotificationService) {}

  handleConnection(client: Socket) {
    console.log(`✅ Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);
  }

  async emitNewDraft(post: any, authorName: string) {
    const notification = await this.notificationService.create({
      title: post.title,
      message: `📝 ${authorName} saved as draft • ${new Date().toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        },
      )}`,
      type: NotificationType.NEW_DRAFT,
      postId: post._id?.toString(),
      authorName,
      data: {
        postId: post._id?.toString(),
        title: post.title,
        authorName,
        isDraft: true,
      },
    });

    this.server.emit('admin_notification', {
      id: notification._id,
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data: notification.data,
      createdAt: notification['createdAt'],
      isRead: false,
    });
  }

  // Called from PostsService when a new post is created
  async emitNewPost(post: any, authorName: string) {
    const notification = await this.notificationService.create({
      title: post.title,
      message: ` 📝 ${authorName} created • ${new Date().toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        },
      )}`,
      type: NotificationType.NEW_POST,
      postId: post._id?.toString(),
      authorName,
      data: {
        postId: post._id?.toString(),
        title: post.title,
        authorName,
      },
    });

    this.server.emit('new_notification', {
      id: notification._id,
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data: notification.data,
      createdAt: notification['createdAt'],
      isRead: false,
    });
  }

  async emitPostUpdated(post: any, authorName: string) {
    const notification = await this.notificationService.create({
      title: post.title,
      message: `✏️ ${authorName} updated • ${new Date().toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        },
      )}`,
      type: NotificationType.POST_UPDATED,
      postId: post._id?.toString(),
      authorName,
      data: {
        postId: post._id?.toString(),
        title: post.title,
        authorName,
      },
    });

    this.server.emit('admin_notification', {
      id: notification._id,
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data: notification.data,
      createdAt: notification['createdAt'],
      isRead: false,
    });
  }

  async emitPostDeleted(postTitle: string, authorName: string) {
    const notification = await this.notificationService.create({
      title: postTitle,
      message: `🗑️ ${authorName} deleted • ${new Date().toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        },
      )}`,
      type: NotificationType.POST_DELETED,
      authorName,
    });

    this.server.emit('admin_notification', {
      id: notification._id,
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification['createdAt'],
      isRead: false,
    });
  }

  async emitPostPublished(post: any, authorName: string) {
    const notification = await this.notificationService.create({
      title: post.title,
      message: `🔴 ${authorName} went live • ${new Date().toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        },
      )}`,
      type: NotificationType.POST_PUBLISHED,
      postId: post._id?.toString(),
      authorName,
      data: {
        postId: post._id?.toString(),
        title: post.title,
        authorName,
      },
    });

    this.server.emit('new_notification', {
      id: notification._id,
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data: notification.data,
      createdAt: notification['createdAt'],
      isRead: false,
    });
  }

  async emitAdCreated(ad: any, authorName: string) {
    console.log('📢 emitAdCreated called for:', ad.name, 'by:', authorName);
    const notification = await this.notificationService.create({
      title: ad.name,
      message: `🆕 ${authorName} created ad • ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      type: NotificationType.AD_CREATED,
      authorName,
      data: { adId: ad._id?.toString(), name: ad.name, authorName },
    });
    console.log('✅ Notification saved:', notification._id?.toString());
    console.log('📡 Emitting to', this.server.sockets.sockets.size, 'clients');
    this.server.emit('admin_notification', {
      id: notification._id,
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data: notification.data,
      createdAt: notification['createdAt'],
      isRead: false,
    });
  }

  async emitAdUpdated(ad: any, authorName: string) {
    const notification = await this.notificationService.create({
      title: ad.name,
      message: `✏️ ${authorName} updated ad • ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      type: NotificationType.AD_UPDATED,
      authorName,
      data: { adId: ad._id?.toString(), name: ad.name, authorName },
    });
    this.server.emit('admin_notification', {
      id: notification._id,
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data: notification.data,
      createdAt: notification['createdAt'],
      isRead: false,
    });
  }

  async emitAdDeleted(adName: string, authorName: string) {
    const notification = await this.notificationService.create({
      title: adName,
      message: `🗑️ ${authorName} deleted ad • ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      type: NotificationType.AD_DELETED,
      authorName,
    });
    this.server.emit('admin_notification', {
      id: notification._id,
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification['createdAt'],
      isRead: false,
    });
  }

  async emitAdToggled(ad: any, authorName: string) {
    const status = ad.isActive ? '✅ activated' : '⏸️ deactivated';
    const notification = await this.notificationService.create({
      title: ad.name,
      message: `${authorName} ${status} ad • ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      type: NotificationType.AD_TOGGLED,
      authorName,
      data: {
        adId: ad._id?.toString(),
        name: ad.name,
        isActive: ad.isActive,
        authorName,
      },
    });
    this.server.emit('admin_notification', {
      id: notification._id,
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data: notification.data,
      createdAt: notification['createdAt'],
      isRead: false,
    });
  }

  async emitAdExpiringSoon(ad: any, daysLeft: number) {
    const endDate = new Date(ad.endDate).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const notification = await this.notificationService.create({
      title: ad.name,
      message: `⏰ This ad will expire in ${daysLeft} day${daysLeft > 1 ? 's' : ''} on ${endDate}. Consider renewing it before it stops showing.`,
      type: NotificationType.AD_EXPIRING,
      authorName: 'System',
      data: { adId: ad._id?.toString(), name: ad.name, daysLeft },
    });

    this.server.emit('admin_notification', {
      id: notification._id,
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data: notification.data,
      createdAt: notification['createdAt'],
      isRead: false,
    });
  }

  async emitAdminCreated(admin: any, creatorName: string) {
    const notification = await this.notificationService.create({
      title: admin.displayName || admin.username,
      message: `👤 ${creatorName} created new admin • ${new Date().toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        },
      )}`,
      type: NotificationType.ADMIN_CREATED,
      authorName: creatorName,
      data: {
        adminId: admin._id?.toString(),
        username: admin.username,
        displayName: admin.displayName,
        role: admin.role,
      },
    });

    this.server.emit('admin_notification', {
      id: notification._id,
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data: notification.data,
      createdAt: notification['createdAt'],
      isRead: false,
    });
  }

  async emitAdminUpdated(admin: any, updaterName: string) {
    const notification = await this.notificationService.create({
      title: admin.displayName || admin.username,
      message: `✏️ ${updaterName} updated account details • ${new Date().toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        },
      )}`,
      type: NotificationType.ADMIN_UPDATED,
      authorName: updaterName,
      data: {
        adminId: admin._id?.toString(),
        username: admin.username,
        displayName: admin.displayName,
      },
    });

    this.server.emit('admin_notification', {
      id: notification._id,
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data: notification.data,
      createdAt: notification['createdAt'],
      isRead: false,
    });
  }

  async emitAdminDeleted(adminName: string, deleterName: string) {
    const notification = await this.notificationService.create({
      title: adminName,
      message: `🗑️ ${deleterName} deleted admin • ${new Date().toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        },
      )}`,
      type: NotificationType.ADMIN_DELETED,
      authorName: deleterName,
    });

    this.server.emit('admin_notification', {
      id: notification._id,
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification['createdAt'],
      isRead: false,
    });
  }

  async emitAdminToggled(admin: any, togglerName: string) {
    const status = admin.isActive ? '✅ activated' : '⏸️ deactivated';
    const notification = await this.notificationService.create({
      title: admin.displayName || admin.username,
      message: `${togglerName} ${status} this account • ${new Date().toLocaleDateString(
        'en-US',
        {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        },
      )}`,
      type: NotificationType.ADMIN_TOGGLED,
      authorName: togglerName,
      data: {
        adminId: admin._id?.toString(),
        username: admin.username,
        isActive: admin.isActive,
      },
    });

    this.server.emit('admin_notification', {
      id: notification._id,
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data: notification.data,
      createdAt: notification['createdAt'],
      isRead: false,
    });
  }

  private buildPayload(notification: any, extraData?: any) {
    return {
      id: notification._id?.toString(),
      _id: notification._id?.toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data: extraData || notification.data,
      createdAt: notification['createdAt'],
      isRead: false,
    };
  }
  // Client requests notification history
  @SubscribeMessage('get_notifications')
  async handleGetNotifications(client: Socket) {
    const notifications = await this.notificationService.findAll(20);
    const unreadCount = await this.notificationService.getUnreadCount();

    // ← Convert _id to string for all notifications
    const mapped = notifications.map((n: any) => ({
      id: n._id?.toString(),
      _id: n._id?.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      data: n.data,
      createdAt: n.createdAt,
      isRead: n.isRead,
    }));

    client.emit('notifications_list', { notifications: mapped, unreadCount });
  }

  // Client marks all as read
  @SubscribeMessage('mark_all_read')
  async handleMarkAllRead(client: Socket) {
    await this.notificationService.markAllAsRead();
    this.server.emit('notifications_cleared');
  }

  // Client marks one as read
  @SubscribeMessage('mark_read')
  async handleMarkRead(client: Socket, payload: { id: string }) {
    await this.notificationService.markAsRead(payload.id);
    client.emit('notification_read', { id: payload.id });
  }
}

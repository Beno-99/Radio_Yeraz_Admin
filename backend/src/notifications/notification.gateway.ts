// src/notifications/notification.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { NotificationType, Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationResponse,
  NotificationService,
} from './notification.service';

const socketAllowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  : [
      'https://player.radioyeraz.com',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
    ];

interface JwtPayload {
  sub?: string;
}

type SocketAuthErrorCode =
  | 'AUTH_REQUIRED'
  | 'TOKEN_EXPIRED'
  | 'INVALID_TOKEN'
  | 'INACTIVE_ACCOUNT';

class SocketAuthError extends Error {
  constructor(
    readonly code: SocketAuthErrorCode,
    message: string,
  ) {
    super(message);
  }
}

interface IdentifiedPayload {
  _id?: string;
  id?: string;
}

interface PostNotificationPayload extends IdentifiedPayload {
  title: string;
}

interface AdNotificationPayload extends IdentifiedPayload {
  name: string;
  isActive?: boolean;
  endDate?: Date | string | null;
}

interface AdminNotificationPayload extends IdentifiedPayload {
  username: string;
  displayName?: string;
  role?: string;
  isActive?: boolean;
}

interface NotificationSocketPayload {
  id: string;
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  data: Prisma.JsonValue | null;
  createdAt: Date;
  isRead: boolean;
}

@WebSocketGateway({
  cors: {
    origin: socketAllowedOrigins,
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const adminId = await this.authenticateClient(client);
      client.data.adminId = adminId;
      console.log(`Client connected: ${client.id}`);
    } catch (error) {
      const authError =
        error instanceof SocketAuthError
          ? error
          : new SocketAuthError('INVALID_TOKEN', 'Invalid authentication token');

      console.warn(`Socket authentication failed: ${authError.code}`);
      client.emit('auth_error', {
        code: authError.code,
        message: authError.message,
      });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    console.log(`Client disconnected: ${client.id}`);
  }

  private getEntityId(entity: IdentifiedPayload): string {
    return entity._id ?? entity.id ?? '';
  }

  private getSocketToken(client: Socket): string | undefined {
    const auth = client.handshake.auth as Record<string, unknown>;
    const authToken = typeof auth.token === 'string' ? auth.token : undefined;
    const authorization = client.handshake.headers.authorization;
    const headerToken =
      typeof authorization === 'string' && authorization.startsWith('Bearer ')
        ? authorization.slice('Bearer '.length)
        : undefined;

    return authToken ?? headerToken;
  }

  private async authenticateClient(client: Socket): Promise<string> {
    const token = this.getSocketToken(client);
    if (!token) {
      throw new SocketAuthError('AUTH_REQUIRED', 'Authentication required');
    }

    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify<JwtPayload>(token);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new SocketAuthError('TOKEN_EXPIRED', 'Access token expired');
      }

      throw new SocketAuthError('INVALID_TOKEN', 'Invalid authentication token');
    }

    if (!payload.sub) {
      throw new SocketAuthError('INVALID_TOKEN', 'Invalid authentication token');
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true },
    });

    if (!admin || !admin.isActive) {
      throw new SocketAuthError('INACTIVE_ACCOUNT', 'Account is inactive');
    }

    return admin.id;
  }

  private buildPayload(
    notification: NotificationResponse,
    data: Prisma.JsonValue | null = notification.data,
  ): NotificationSocketPayload {
    return {
      id: notification._id,
      _id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data,
      createdAt: notification.createdAt,
      isRead: notification.isRead,
    };
  }

  async emitNewDraft(
    post: PostNotificationPayload,
    authorName: string,
  ): Promise<void> {
    const postId = this.getEntityId(post);
    const notification = await this.notificationService.create({
      title: post.title,
      message: `${authorName} saved a draft - ${new Date().toLocaleDateString(
        'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' },
      )}`,
      type: NotificationType.NEW_DRAFT,
      postId,
      authorName,
      data: {
        postId,
        title: post.title,
        authorName,
        isDraft: true,
      },
    });

    this.server.emit('admin_notification', this.buildPayload(notification));
  }

  async emitNewPost(
    post: PostNotificationPayload,
    authorName: string,
  ): Promise<void> {
    const postId = this.getEntityId(post);
    const notification = await this.notificationService.create({
      title: post.title,
      message: `${authorName} created - ${new Date().toLocaleDateString(
        'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' },
      )}`,
      type: NotificationType.NEW_POST,
      postId,
      authorName,
      data: {
        postId,
        title: post.title,
        authorName,
      },
    });

    this.server.emit('new_notification', this.buildPayload(notification));
  }

  async emitPostUpdated(
    post: PostNotificationPayload,
    authorName: string,
  ): Promise<void> {
    const postId = this.getEntityId(post);
    const notification = await this.notificationService.create({
      title: post.title,
      message: `${authorName} updated - ${new Date().toLocaleDateString(
        'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' },
      )}`,
      type: NotificationType.POST_UPDATED,
      postId,
      authorName,
      data: {
        postId,
        title: post.title,
        authorName,
      },
    });

    this.server.emit('admin_notification', this.buildPayload(notification));
  }

  async emitPostDeleted(
    postTitle: string,
    authorName: string,
  ): Promise<void> {
    const notification = await this.notificationService.create({
      title: postTitle,
      message: `${authorName} deleted - ${new Date().toLocaleDateString(
        'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' },
      )}`,
      type: NotificationType.POST_DELETED,
      authorName,
    });

    this.server.emit('admin_notification', this.buildPayload(notification));
  }

  async emitPostPublished(
    post: PostNotificationPayload,
    authorName: string,
  ): Promise<void> {
    const postId = this.getEntityId(post);
    const notification = await this.notificationService.create({
      title: post.title,
      message: `${authorName} went live - ${new Date().toLocaleDateString(
        'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' },
      )}`,
      type: NotificationType.POST_PUBLISHED,
      postId,
      authorName,
      data: {
        postId,
        title: post.title,
        authorName,
      },
    });

    this.server.emit('new_notification', this.buildPayload(notification));
  }

  async emitAdCreated(
    ad: AdNotificationPayload,
    authorName: string,
  ): Promise<void> {
    const adId = this.getEntityId(ad);
    const notification = await this.notificationService.create({
      title: ad.name,
      message: `${authorName} created ad - ${new Date().toLocaleDateString(
        'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' },
      )}`,
      type: NotificationType.AD_CREATED,
      authorName,
      data: { adId, name: ad.name, authorName },
    });

    this.server.emit('admin_notification', this.buildPayload(notification));
  }

  async emitAdUpdated(
    ad: AdNotificationPayload,
    authorName: string,
  ): Promise<void> {
    const adId = this.getEntityId(ad);
    const notification = await this.notificationService.create({
      title: ad.name,
      message: `${authorName} updated ad - ${new Date().toLocaleDateString(
        'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' },
      )}`,
      type: NotificationType.AD_UPDATED,
      authorName,
      data: { adId, name: ad.name, authorName },
    });

    this.server.emit('admin_notification', this.buildPayload(notification));
  }

  async emitAdDeleted(adName: string, authorName: string): Promise<void> {
    const notification = await this.notificationService.create({
      title: adName,
      message: `${authorName} deleted ad - ${new Date().toLocaleDateString(
        'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' },
      )}`,
      type: NotificationType.AD_DELETED,
      authorName,
    });

    this.server.emit('admin_notification', this.buildPayload(notification));
  }

  async emitAdToggled(
    ad: AdNotificationPayload,
    authorName: string,
  ): Promise<void> {
    const adId = this.getEntityId(ad);
    const status = ad.isActive ? 'activated' : 'deactivated';
    const notification = await this.notificationService.create({
      title: ad.name,
      message: `${authorName} ${status} ad - ${new Date().toLocaleDateString(
        'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' },
      )}`,
      type: NotificationType.AD_TOGGLED,
      authorName,
      data: {
        adId,
        name: ad.name,
        isActive: ad.isActive ?? false,
        authorName,
      },
    });

    this.server.emit('admin_notification', this.buildPayload(notification));
  }

  async emitAdExpiringSoon(
    ad: AdNotificationPayload,
    daysLeft: number,
  ): Promise<void> {
    const adId = this.getEntityId(ad);
    const endDate = ad.endDate
      ? new Date(ad.endDate).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : 'its end date';

    const notification = await this.notificationService.create({
      title: ad.name,
      message: `This ad will expire in ${daysLeft} day${daysLeft > 1 ? 's' : ''} on ${endDate}. Consider renewing it before it stops showing.`,
      type: NotificationType.AD_EXPIRING,
      authorName: 'System',
      data: { adId, name: ad.name, daysLeft },
    });

    this.server.emit('admin_notification', this.buildPayload(notification));
  }

  async emitAdminCreated(
    admin: AdminNotificationPayload,
    creatorName: string,
  ): Promise<void> {
    const adminId = this.getEntityId(admin);
    const title = admin.displayName || admin.username;
    const notification = await this.notificationService.create({
      title,
      message: `${creatorName} created new admin - ${new Date().toLocaleDateString(
        'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' },
      )}`,
      type: NotificationType.ADMIN_CREATED,
      authorName: creatorName,
      data: {
        adminId,
        username: admin.username,
        displayName: admin.displayName || '',
        role: admin.role || '',
      },
    });

    this.server.emit('admin_notification', this.buildPayload(notification));
  }

  async emitAdminUpdated(
    admin: AdminNotificationPayload,
    updaterName: string,
  ): Promise<void> {
    const adminId = this.getEntityId(admin);
    const title = admin.displayName || admin.username;
    const notification = await this.notificationService.create({
      title,
      message: `${updaterName} updated account details - ${new Date().toLocaleDateString(
        'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' },
      )}`,
      type: NotificationType.ADMIN_UPDATED,
      authorName: updaterName,
      data: {
        adminId,
        username: admin.username,
        displayName: admin.displayName || '',
      },
    });

    this.server.emit('admin_notification', this.buildPayload(notification));
  }

  async emitAdminDeleted(
    adminName: string,
    deleterName: string,
  ): Promise<void> {
    const notification = await this.notificationService.create({
      title: adminName,
      message: `${deleterName} deleted admin - ${new Date().toLocaleDateString(
        'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' },
      )}`,
      type: NotificationType.ADMIN_DELETED,
      authorName: deleterName,
    });

    this.server.emit('admin_notification', this.buildPayload(notification));
  }

  async emitAdminToggled(
    admin: AdminNotificationPayload,
    togglerName: string,
  ): Promise<void> {
    const adminId = this.getEntityId(admin);
    const status = admin.isActive ? 'activated' : 'deactivated';
    const title = admin.displayName || admin.username;
    const notification = await this.notificationService.create({
      title,
      message: `${togglerName} ${status} this account - ${new Date().toLocaleDateString(
        'en-US',
        { month: 'short', day: 'numeric', year: 'numeric' },
      )}`,
      type: NotificationType.ADMIN_TOGGLED,
      authorName: togglerName,
      data: {
        adminId,
        username: admin.username,
        isActive: admin.isActive ?? false,
      },
    });

    this.server.emit('admin_notification', this.buildPayload(notification));
  }

  @SubscribeMessage('get_notifications')
  async handleGetNotifications(client: Socket): Promise<void> {
    const notifications = await this.notificationService.findAll(20);
    const unreadCount = await this.notificationService.getUnreadCount();
    const mapped = notifications.map((notification) =>
      this.buildPayload(notification),
    );

    client.emit('notifications_list', { notifications: mapped, unreadCount });
  }

  @SubscribeMessage('mark_all_read')
  async handleMarkAllRead(): Promise<void> {
    await this.notificationService.markAllAsRead();
    this.server.emit('notifications_cleared');
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    client: Socket,
    payload: { id: string },
  ): Promise<void> {
    await this.notificationService.markAsRead(payload.id);
    client.emit('notification_read', { id: payload.id });
  }
}

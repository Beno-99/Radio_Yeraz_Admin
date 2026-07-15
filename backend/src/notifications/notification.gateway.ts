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
import { buildAllowedOrigins } from '../common/utils/cors-origins.util';

const socketAllowedOrigins = buildAllowedOrigins();

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

interface CarouselNotificationPayload extends IdentifiedPayload {
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

  private getAdminRoom(adminId: string): string {
    return `admin:${adminId}`;
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

    client.join(this.getAdminRoom(admin.id));

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

  private emitToAdmins(
    eventName: 'admin_notification' | 'new_notification',
    notification: NotificationResponse,
    actorId?: string,
  ): void {
    const payload = this.buildPayload(notification);

    if (actorId) {
      this.server.except(this.getAdminRoom(actorId)).emit(eventName, payload);
      return;
    }

    this.server.emit(eventName, payload);
  }

  async emitNewDraft(
    post: PostNotificationPayload,
    actorName: string,
    actorId?: string,
  ): Promise<void> {
    const postId = this.getEntityId(post);
    const notification = await this.notificationService.create({
      title: post.title,
      message: `${actorName} saved "${post.title}" as a draft.`,
      type: NotificationType.NEW_DRAFT,
      postId,
      authorName: actorName,
      data: {
        postId,
        title: post.title,
        authorName: actorName,
        actorId,
        isDraft: true,
        action: 'post_draft_created',
      },
    });

    this.emitToAdmins('admin_notification', notification, actorId);
  }

  async emitNewPost(
    post: PostNotificationPayload,
    actorName: string,
    actorId?: string,
  ): Promise<void> {
    const postId = this.getEntityId(post);
    const title = 'Radio Yeraz shared a new post';
    const message = post.title || 'Tap to read the latest update.';
    const notification = await this.notificationService.create({
      title,
      message,
      type: NotificationType.NEW_POST,
      postId,
      authorName: actorName,
      data: {
        postId,
        title,
        message,
        postTitle: post.title,
        authorName: actorName,
        actorId,
        action: 'post_published',
      },
    });

    this.emitToAdmins('new_notification', notification, actorId);
  }

  async emitPostUpdated(
    post: PostNotificationPayload,
    actorName: string,
    actorId?: string,
  ): Promise<void> {
    const postId = this.getEntityId(post);
    const notification = await this.notificationService.create({
      title: post.title,
      message: `${actorName} updated "${post.title}".`,
      type: NotificationType.POST_UPDATED,
      postId,
      authorName: actorName,
      data: {
        postId,
        title: post.title,
        authorName: actorName,
        actorId,
        action: 'post_updated',
      },
    });

    this.emitToAdmins('admin_notification', notification, actorId);
  }

  async emitPostDeleted(
    postTitle: string,
    actorName: string,
    actorId?: string,
  ): Promise<void> {
    const notification = await this.notificationService.create({
      title: postTitle,
      message: `${actorName} deleted the post "${postTitle}".`,
      type: NotificationType.POST_DELETED,
      authorName: actorName,
      data: {
        title: postTitle,
        authorName: actorName,
        actorId,
        action: 'post_deleted',
      },
    });

    this.emitToAdmins('admin_notification', notification, actorId);
  }

  async emitPostPublished(
    post: PostNotificationPayload,
    actorName: string,
    actorId?: string,
  ): Promise<void> {
    const postId = this.getEntityId(post);
    const notification = await this.notificationService.create({
      title: post.title,
      message: `${actorName} marked "${post.title}" as live.`,
      type: NotificationType.POST_PUBLISHED,
      postId,
      authorName: actorName,
      data: {
        postId,
        title: post.title,
        authorName: actorName,
        actorId,
        action: 'post_marked_live',
      },
    });

    this.emitToAdmins('new_notification', notification, actorId);
  }

  async emitCarouselCreated(
    carousel: CarouselNotificationPayload,
    actorName: string,
    actorId?: string,
  ): Promise<void> {
    const carouselId = this.getEntityId(carousel);
    const notification = await this.notificationService.create({
      title: carousel.name,
      message: `${actorName} created the carousel "${carousel.name}".`,
      type: NotificationType.CAROUSEL_CREATED,
      authorName: actorName,
      data: {
        carouselId,
        name: carousel.name,
        authorName: actorName,
        actorId,
        action: 'carousel_created',
      },
    });

    this.emitToAdmins('admin_notification', notification, actorId);
  }

  async emitCarouselUpdated(
    carousel: CarouselNotificationPayload,
    actorName: string,
    actorId?: string,
  ): Promise<void> {
    const carouselId = this.getEntityId(carousel);
    const notification = await this.notificationService.create({
      title: carousel.name,
      message: `${actorName} updated the carousel "${carousel.name}".`,
      type: NotificationType.CAROUSEL_UPDATED,
      authorName: actorName,
      data: {
        carouselId,
        name: carousel.name,
        authorName: actorName,
        actorId,
        action: 'carousel_updated',
      },
    });

    this.emitToAdmins('admin_notification', notification, actorId);
  }

  async emitCarouselDeleted(
    carouselName: string,
    actorName: string,
    actorId?: string,
  ): Promise<void> {
    const notification = await this.notificationService.create({
      title: carouselName,
      message: `${actorName} deleted the carousel "${carouselName}".`,
      type: NotificationType.CAROUSEL_DELETED,
      authorName: actorName,
      data: {
        name: carouselName,
        authorName: actorName,
        actorId,
        action: 'carousel_deleted',
      },
    });

    this.emitToAdmins('admin_notification', notification, actorId);
  }

  async emitCarouselToggled(
    carousel: CarouselNotificationPayload,
    actorName: string,
    actorId?: string,
  ): Promise<void> {
    const carouselId = this.getEntityId(carousel);
    const status = carousel.isActive ? 'activated' : 'deactivated';
    const notification = await this.notificationService.create({
      title: carousel.name,
      message: `${actorName} ${status} the carousel "${carousel.name}".`,
      type: NotificationType.CAROUSEL_TOGGLED,
      authorName: actorName,
      data: {
        carouselId,
        name: carousel.name,
        isActive: carousel.isActive ?? false,
        authorName: actorName,
        actorId,
        action: carousel.isActive
          ? 'carousel_activated'
          : 'carousel_deactivated',
      },
    });

    this.emitToAdmins('admin_notification', notification, actorId);
  }

  async emitCarouselExpiringSoon(
    carousel: CarouselNotificationPayload,
    daysLeft: number,
  ): Promise<void> {
    const carouselId = this.getEntityId(carousel);
    const endDate = carousel.endDate
      ? new Date(carousel.endDate).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      : 'its end date';

    const notification = await this.notificationService.create({
      title: carousel.name,
      message: `This carousel will expire in ${daysLeft} day${daysLeft > 1 ? 's' : ''} on ${endDate}. Consider renewing it before it stops showing.`,
      type: NotificationType.CAROUSEL_EXPIRING,
      authorName: 'System',
      data: { carouselId, name: carousel.name, daysLeft },
    });

    this.emitToAdmins('admin_notification', notification);
  }

  async emitAdminCreated(
    admin: AdminNotificationPayload,
    creatorName: string,
    creatorId?: string,
  ): Promise<void> {
    const adminId = this.getEntityId(admin);
    const title = admin.displayName || admin.username;
    const notification = await this.notificationService.create({
      title,
      message: `${creatorName} created the admin account "${title}".`,
      type: NotificationType.ADMIN_CREATED,
      authorName: creatorName,
      data: {
        adminId,
        username: admin.username,
        displayName: admin.displayName || '',
        role: admin.role || '',
        authorName: creatorName,
        actorId: creatorId,
        action: 'admin_created',
      },
    });

    this.emitToAdmins('admin_notification', notification, creatorId);
  }

  async emitAdminUpdated(
    admin: AdminNotificationPayload,
    updaterName: string,
    updaterId?: string,
  ): Promise<void> {
    const adminId = this.getEntityId(admin);
    const title = admin.displayName || admin.username;
    const notification = await this.notificationService.create({
      title,
      message: `${updaterName} updated the admin account "${title}".`,
      type: NotificationType.ADMIN_UPDATED,
      authorName: updaterName,
      data: {
        adminId,
        username: admin.username,
        displayName: admin.displayName || '',
        authorName: updaterName,
        actorId: updaterId,
        action: 'admin_updated',
      },
    });

    this.emitToAdmins('admin_notification', notification, updaterId);
  }

  async emitAdminDeleted(
    adminName: string,
    deleterName: string,
    deleterId?: string,
  ): Promise<void> {
    const notification = await this.notificationService.create({
      title: adminName,
      message: `${deleterName} deleted the admin account "${adminName}".`,
      type: NotificationType.ADMIN_DELETED,
      authorName: deleterName,
      data: {
        username: adminName,
        authorName: deleterName,
        actorId: deleterId,
        action: 'admin_deleted',
      },
    });

    this.emitToAdmins('admin_notification', notification, deleterId);
  }

  async emitAdminToggled(
    admin: AdminNotificationPayload,
    togglerName: string,
    togglerId?: string,
  ): Promise<void> {
    const adminId = this.getEntityId(admin);
    const status = admin.isActive ? 'activated' : 'deactivated';
    const title = admin.displayName || admin.username;
    const notification = await this.notificationService.create({
      title,
      message: `${togglerName} ${status} the admin account "${title}".`,
      type: NotificationType.ADMIN_TOGGLED,
      authorName: togglerName,
      data: {
        adminId,
        username: admin.username,
        isActive: admin.isActive ?? false,
        authorName: togglerName,
        actorId: togglerId,
        action: admin.isActive ? 'admin_activated' : 'admin_deactivated',
      },
    });

    this.emitToAdmins('admin_notification', notification, togglerId);
  }

  @SubscribeMessage('get_notifications')
  async handleGetNotifications(client: Socket): Promise<void> {
    const adminId =
      typeof client.data.adminId === 'string' ? client.data.adminId : undefined;
    const notifications = adminId
      ? await this.notificationService.findAllForAdmin(adminId, 20)
      : await this.notificationService.findAll(20);
    const unreadCount = adminId
      ? await this.notificationService.getUnreadCountForAdmin(adminId)
      : await this.notificationService.getUnreadCount();
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

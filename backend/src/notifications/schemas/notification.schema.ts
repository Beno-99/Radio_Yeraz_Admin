// src/notifications/schemas/notification.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  NEW_POST = 'NEW_POST',
  NEW_DRAFT = 'NEW_DRAFT',
  POST_UPDATED = 'POST_UPDATED',
  POST_DELETED = 'POST_DELETED',
  POST_PUBLISHED = 'POST_PUBLISHED',
  AD_CREATED = 'AD_CREATED',
  AD_UPDATED = 'AD_UPDATED',
  AD_DELETED = 'AD_DELETED',
  AD_TOGGLED = 'AD_TOGGLED',
  AD_EXPIRING = 'AD_EXPIRING',
  ADMIN_CREATED = 'ADMIN_CREATED',
  ADMIN_UPDATED = 'ADMIN_UPDATED',
  ADMIN_DELETED = 'ADMIN_DELETED',
  ADMIN_TOGGLED = 'ADMIN_TOGGLED',
}

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({ type: Object })
  data?: Record<string, any>;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  postId?: string;

  @Prop()
  authorName?: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

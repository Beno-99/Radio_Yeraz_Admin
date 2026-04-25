import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Admin } from '../../admin/schemas/admin.schema';
import { Optional } from '@nestjs/common';

export type PostDocument = Post & Document;

@Schema({
  timestamps: true,
  collection: 'posts',
})
export class Post {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ default: '' })
  mainImage: string;

  @Prop({ default: '' })
  video: string;

  @Prop({ default: 'Radio Yeraz' })
  profileName: string;

  @Prop({ type: Date })
  eventDate: Date;

  @Prop({ type: String })
  eventTime: string;

  @Prop()
  location: string;

  @Prop({ type: Boolean, default: false })
  isLive: boolean;

  @Prop({ type: Boolean, default: false })
  isPublished: boolean;

  @Prop({ default: Date.now })
  postedDate: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Admin', required: true })
  author: Types.ObjectId;

  @Prop()
  link: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({
    type: Date,
    default: () => new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
  })
  expiresAt: Date;

  @Prop({ type: Date, default: null })
  reminderSentAt?: Date;
}

export const PostSchema = SchemaFactory.createForClass(Post);

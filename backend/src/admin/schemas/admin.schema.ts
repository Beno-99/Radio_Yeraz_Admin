// src/admin/schemas/admin.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Post } from '../../posts/schemas/post.schema';
import { Ad } from '../../ads/schemas/ad.schema';
import { RefreshToken } from '../../auth/schemas/refresh-token.schema';

export type AdminDocument = Admin &
  Document & {
    _id: Types.ObjectId;
  };

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
}

@Schema({
  timestamps: true,
  collection: 'admins', // MongoDB collection name
})
export class Admin {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'Admin' })
  displayName: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  lastLogin: Date;

  @Prop({
    type: String,
    enum: Role,
    default: Role.ADMIN,
  })
  role: Role;

  @Prop({ default: Date.now })
  updatedAt: Date;

  // Virtual populate for relations (MongoDB doesn't have foreign keys)
  posts?: Post[];
  ads?: Ad[];
  refreshTokens?: RefreshToken[];
}

export const AdminSchema = SchemaFactory.createForClass(Admin);

// Add indexes
AdminSchema.index({ role: 1 });
AdminSchema.index({ isActive: 1 });

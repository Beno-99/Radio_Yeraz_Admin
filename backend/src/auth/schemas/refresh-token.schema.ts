// src/auth/schemas/refresh-token.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Admin } from '../../admin/schemas/admin.schema';

export type RefreshTokenDocument = RefreshToken & Document;

@Schema({
  timestamps: true, // This automatically adds createdAt and updatedAt
  collection: 'refresh_tokens',
})
export class RefreshToken {
  @Prop({ required: true, unique: true })
  token: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Admin', required: true })
  admin: Types.ObjectId;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: false })
  isRevoked: boolean;

  // createdAt and updatedAt will be added automatically by timestamps: true
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

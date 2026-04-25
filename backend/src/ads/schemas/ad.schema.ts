import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Admin } from '../../admin/schemas/admin.schema';

export type AdDocument = Ad &
  Document & {
    author: Admin;
  };

@Schema({
  timestamps: true,
  collection: 'ads',
})
export class Ad {
  @Prop({ required: true })
  image: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  clicks: number;

  @Prop({ default: Date.now })
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Admin', required: true })
  author: Types.ObjectId;

  @Prop()
  targetUrl: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const AdSchema = SchemaFactory.createForClass(Ad);

// Add indexes
AdSchema.index({ author: 1 });
AdSchema.index({ isActive: 1 });
AdSchema.index({ name: 1 });

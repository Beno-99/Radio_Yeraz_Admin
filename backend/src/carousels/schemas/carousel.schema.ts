import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Admin } from '../../admin/schemas/admin.schema';

export type CarouselDocument = Carousel &
  Document & {
    author: Admin;
  };

@Schema({
  timestamps: true,
  collection: 'carousels',
})
export class Carousel {
  @Prop({ required: true })
  image: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: String,
    enum: ['pending', 'active', 'inactive', 'expired'],
    default: 'pending',
  })
  status: 'pending' | 'active' | 'inactive' | 'expired';

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

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const CarouselSchema = SchemaFactory.createForClass(Carousel);

// Add indexes
CarouselSchema.index({ author: 1 });
CarouselSchema.index({ isActive: 1 });
CarouselSchema.index({ name: 1 });
CarouselSchema.index({ displayOrder: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type StreamLinkDocument = StreamLink & Document;

@Schema({ timestamps: true })
export class StreamLink {
  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: String, required: true })
  url: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: Number, default: null })
  bitrate?: number | null;

  @Prop({ type: Number, default: 0 })
  displayOrder: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const StreamLinkSchema = SchemaFactory.createForClass(StreamLink);

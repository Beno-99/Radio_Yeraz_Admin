import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StreamLink, StreamLinkDocument } from './schemas/stream-link.schema';
import { CreateStreamLinkDto } from './dto/create-stream-link.dto';
import { UpdateStreamLinkDto } from './dto/update-stream-link.dto';

@Injectable()
export class StreamLinkService {
  constructor(
    @InjectModel(StreamLink.name)
    private streamLinkModel: Model<StreamLinkDocument>,
  ) {}

  async create(dto: CreateStreamLinkDto): Promise<StreamLinkDocument> {
    const created = new this.streamLinkModel(dto);
    return created.save();
  }

  async findAll(): Promise<StreamLinkDocument[]> {
    return this.streamLinkModel.find().sort({ createdAt: -1 }).exec();
  }

  async findActive(): Promise<StreamLinkDocument[]> {
    return this.streamLinkModel.find({ isActive: true }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<StreamLinkDocument> {
    const streamLink = await this.streamLinkModel.findById(id).exec();
    if (!streamLink) {
      throw new NotFoundException(`Stream link with ID ${id} not found`);
    }
    return streamLink;
  }

  async update(id: string, dto: UpdateStreamLinkDto): Promise<StreamLinkDocument> {
    const updated = await this.streamLinkModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();

    if (!updated) throw new NotFoundException(`Stream link with ID ${id} not found`);
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.streamLinkModel.findByIdAndDelete(id).exec();
    if (!result) throw new NotFoundException(`Stream link with ID ${id} not found`);
  }
}
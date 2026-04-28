// src/ads/ads.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Ad, AdDocument } from './schemas/ad.schema';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';
import { NotificationGateway } from '../notifications/notification.gateway';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AdsService {
  constructor(
    @InjectModel(Ad.name) private adModel: Model<AdDocument>,
    private notificationGateway: NotificationGateway, // ← ADDED
  ) {}

  async create(
    createAdDto: CreateAdDto,
    authorId: string,
  ): Promise<AdDocument> {
    const adData = {
      ...createAdDto,
      author: new Types.ObjectId(authorId),
    };

    const ad = new this.adModel(adData);
    await ad.save();
    const populated = await ad.populate('author', 'username displayName');

    // ← Get name from populated author
    const author = populated.author as any;
    const authorName = author?.displayName || author?.username || 'Admin';

    try {
      await this.notificationGateway.emitAdCreated(populated, authorName);
    } catch (e) {
      console.error('⚠️ Ad notification failed:', (e as Error).message);
    }

    return populated;
  }

  async findAll(page: number = 1, limit: number = 10, filters: any = {}) {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    this.adModel
      .find(filters)
      .populate('author', 'username displayName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    this.adModel.countDocuments(filters),
  ]);

  return { data, total, page, pages: Math.ceil(total / limit) };
}

  async findOne(id: string): Promise<AdDocument> {
    const ad = await this.adModel
      .findById(id)
      .populate('author', 'username displayName')
      .exec();

    if (!ad) throw new NotFoundException('Ad not found');
    return ad;
  }

  async update(
    id: string,
    updateAdDto: UpdateAdDto,
    authorName: string = 'Admin', // ← ADDED
  ): Promise<AdDocument> {
    console.log('🔄 SERVICE UPDATE - received:', updateAdDto);

    // Get old ad to check isActive change
    const oldAd = await this.adModel.findById(id).exec();

    const updateData: any = { ...updateAdDto, updatedAt: new Date() };
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );

    if (updateData.isActive !== undefined) {
      updateData.isActive = Boolean(updateData.isActive);
    }

    const ad = await this.adModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('author', 'username displayName')
      .exec();

    if (!ad) throw new NotFoundException('Ad not found');

    // ── Notify admins ────────────────────────────────────────
    try {
      if (oldAd?.isActive !== ad.isActive) {
        // Active status changed
        await this.notificationGateway.emitAdToggled(ad, authorName);
      } else {
        // Just updated
        await this.notificationGateway.emitAdUpdated(ad, authorName);
      }
    } catch (e) {
      console.error('⚠️ Ad notification failed:', (e as Error).message);
    }
    // ────────────────────────────────────────────────────────

    return ad;
  }

  async updateImage(id: string, imagePath: string): Promise<AdDocument> {
    const ad = await this.adModel
      .findByIdAndUpdate(
        id,
        { image: imagePath, updatedAt: new Date() },
        { new: true, runValidators: true },
      )
      .populate('author', 'username displayName')
      .exec();

    if (!ad) throw new NotFoundException('Ad not found');
    return ad;
  }

  async delete(
    id: string,
    authorName: string = 'Admin', // ← ADDED
  ): Promise<AdDocument> {
    const ad = await this.adModel.findById(id).exec();
    if (!ad) throw new NotFoundException('Ad not found');

    // Delete image file if exists
    try {
      if (ad.image && ad.image.trim() !== '') {
        const imagePath = path.join(process.cwd(), ad.image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log('✅ Ad image deleted:', ad.image);
        }
      }
    } catch (e) {
      console.error('⚠️ Ad image delete failed:', (e as Error).message);
    }

    await this.adModel.findByIdAndDelete(id).exec();

    // ── Notify admins ────────────────────────────────────────
    try {
      await this.notificationGateway.emitAdDeleted(ad.name, authorName);
    } catch (e) {
      console.error('⚠️ Ad notification failed:', (e as Error).message);
    }
    // ────────────────────────────────────────────────────────

    return ad;
  }
}

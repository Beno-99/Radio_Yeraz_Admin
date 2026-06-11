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

  private deleteMediaFileIfExists(filePath?: string): void {
    if (!filePath || filePath.trim() === '') return;

    const possiblePaths = [
      filePath,
      filePath.startsWith('/uploads') ? filePath : `/uploads${filePath}`,
      filePath.startsWith('/') ? filePath : `/${filePath}`,
    ];

    for (const candidate of possiblePaths) {
      const fullPath = path.join(process.cwd(), candidate);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        break;
      }
    }
  }

  private resolveStatus(
    startDate: Date | string | undefined,
    endDate: Date | string | undefined,
    isActive: boolean,
  ): 'pending' | 'active' | 'inactive' | 'expired' {
    const now = new Date();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (end && !Number.isNaN(end.getTime()) && now > end) {
      return 'expired';
    }
    if (start && !Number.isNaN(start.getTime()) && now < start) {
      return 'pending';
    }
    return isActive ? 'active' : 'inactive';
  }

  async syncLifecycleStatuses(): Promise<void> {
    const now = new Date();

    await this.adModel.updateMany(
      {
        endDate: { $exists: true, $ne: null, $lt: now },
        status: { $ne: 'expired' },
      },
      {
        $set: {
          status: 'expired',
          isActive: false,
          updatedAt: now,
        },
      },
    );

    await this.adModel.updateMany(
      {
        startDate: { $exists: true, $ne: null, $gt: now },
        status: { $ne: 'pending' },
      },
      {
        $set: {
          status: 'pending',
          isActive: false,
          updatedAt: now,
        },
      },
    );

    await this.adModel.updateMany(
      {
        $and: [
          { $or: [{ startDate: { $exists: false } }, { startDate: { $lte: now } }] },
          { $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }] },
          { isActive: true },
          { status: { $ne: 'active' } },
        ],
      },
      {
        $set: {
          status: 'active',
          updatedAt: now,
        },
      },
    );

    await this.adModel.updateMany(
      {
        $and: [
          { $or: [{ startDate: { $exists: false } }, { startDate: { $lte: now } }] },
          { $or: [{ endDate: { $exists: false } }, { endDate: { $gte: now } }] },
          { isActive: false },
          { status: { $ne: 'inactive' } },
        ],
      },
      {
        $set: {
          status: 'inactive',
          updatedAt: now,
        },
      },
    );
  }

  async create(
    createAdDto: CreateAdDto,
    authorId: string,
  ): Promise<AdDocument> {
    const inputIsActive =
      createAdDto.isActive === undefined ? true : Boolean(createAdDto.isActive);
    const computedStatus = this.resolveStatus(
      createAdDto.startDate,
      createAdDto.endDate,
      inputIsActive,
    );

    const adData = {
      ...createAdDto,
      author: new Types.ObjectId(authorId),
      isActive:
        computedStatus === 'pending' || computedStatus === 'expired'
          ? false
          : inputIsActive,
      status: computedStatus,
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
  await this.syncLifecycleStatuses();
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
    await this.syncLifecycleStatuses();

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

    const oldImage = oldAd?.image || '';
    const shouldRemoveImage = updateData.removeImage === 'true';
    const hasNewImage = !!updateData.image;

    if (shouldRemoveImage) {
      updateData.image = '';
    }

    delete updateData.removeImage;

    if (updateData.isActive !== undefined) {
      updateData.isActive = Boolean(updateData.isActive);
    }

    const startDate = updateData.startDate ?? oldAd?.startDate;
    const endDate = updateData.endDate ?? oldAd?.endDate;
    const nextIsActive =
      updateData.isActive !== undefined
        ? updateData.isActive
        : Boolean(oldAd?.isActive);

    const computedStatus = this.resolveStatus(startDate, endDate, nextIsActive);
    updateData.status = computedStatus;
    if (computedStatus === 'pending' || computedStatus === 'expired') {
      updateData.isActive = false;
    }

    const ad = await this.adModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate('author', 'username displayName')
      .exec();

    if (!ad) throw new NotFoundException('Ad not found');

    try {
      if ((shouldRemoveImage || hasNewImage) && oldImage.trim() !== '') {
        const replacedWithDifferentImage = hasNewImage && oldImage !== ad.image;
        if (shouldRemoveImage || replacedWithDifferentImage) {
          this.deleteMediaFileIfExists(oldImage);
        }
      }
    } catch (fileError) {
      console.error('⚠️ Failed to delete replaced/removed ad image:', fileError);
    }

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

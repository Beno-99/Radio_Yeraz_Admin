// src/ads/ads.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Ad as PrismaAd,
  AdStatus,
  Admin as PrismaAdmin,
  AdminRole,
  Prisma,
} from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { Role } from '../admin/schemas/admin.schema';
import { createObjectIdString } from '../common/utils/object-id.utils';
import { NotificationGateway } from '../notifications/notification.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';

const adAuthorSelect = {
  id: true,
  username: true,
  displayName: true,
  role: true,
} satisfies Prisma.AdminSelect;

const adInclude = {
  author: { select: adAuthorSelect },
} satisfies Prisma.AdInclude;

type AdWithAuthor = Prisma.AdGetPayload<{ include: typeof adInclude }>;

export interface AdAuthorResponse
  extends Omit<Pick<PrismaAdmin, 'id' | 'username' | 'displayName'>, never> {
  _id: string;
  role: Role;
}

export interface AdResponse extends Omit<PrismaAd, 'authorId' | 'author'> {
  _id: string;
  author: AdAuthorResponse | null;
  __v: number;
}

export interface AdFindAllFilters {
  isActive?: boolean;
  status?: AdStatus;
  startDateLte?: Date;
  endDateGte?: Date;
}

@Injectable()
export class AdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  private toApiRole(role: AdminRole): Role {
    return role === AdminRole.SUPER_ADMIN ? Role.SUPER_ADMIN : Role.ADMIN;
  }

  private toAdResponse(ad: AdWithAuthor): AdResponse {
    return {
      id: ad.id,
      _id: ad.id,
      image: ad.image,
      isActive: ad.isActive,
      status: ad.status,
      clicks: ad.clicks,
      startDate: ad.startDate,
      endDate: ad.endDate,
      targetUrl: ad.targetUrl,
      name: ad.name,
      createdAt: ad.createdAt,
      updatedAt: ad.updatedAt,
      author: ad.author
        ? {
            id: ad.author.id,
            _id: ad.author.id,
            username: ad.author.username,
            displayName: ad.author.displayName,
            role: this.toApiRole(ad.author.role),
          }
        : null,
      __v: 0,
    };
  }

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

  private parseOptionalDate(value: Date | string | null | undefined): Date | null | undefined {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;

    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private parseOptionalBoolean(value: unknown): boolean | undefined {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    if (value === undefined || value === null) return undefined;
    return Boolean(value);
  }

  private resolveStatus(
    startDate: Date | string | null | undefined,
    endDate: Date | string | null | undefined,
    isActive: boolean,
  ): AdStatus {
    const now = new Date();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (end && !Number.isNaN(end.getTime()) && now > end) {
      return AdStatus.expired;
    }
    if (start && !Number.isNaN(start.getTime()) && now < start) {
      return AdStatus.pending;
    }
    return isActive ? AdStatus.active : AdStatus.inactive;
  }

  private buildWhere(filters: AdFindAllFilters): Prisma.AdWhereInput {
    const where: Prisma.AdWhereInput = {};

    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.status !== undefined) where.status = filters.status;
    if (filters.startDateLte !== undefined) {
      where.startDate = { lte: filters.startDateLte };
    }
    if (filters.endDateGte !== undefined) {
      where.endDate = { gte: filters.endDateGte };
    }

    return where;
  }

  async syncLifecycleStatuses(): Promise<void> {
    const now = new Date();

    await this.prisma.ad.updateMany({
      where: {
        endDate: { lt: now },
        NOT: { status: AdStatus.expired },
      },
      data: {
        status: AdStatus.expired,
        isActive: false,
        updatedAt: now,
      },
    });

    await this.prisma.ad.updateMany({
      where: {
        startDate: { gt: now },
        NOT: { status: AdStatus.pending },
      },
      data: {
        status: AdStatus.pending,
        isActive: false,
        updatedAt: now,
      },
    });

    await this.prisma.ad.updateMany({
      where: {
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
        isActive: true,
        NOT: { status: AdStatus.active },
      },
      data: {
        status: AdStatus.active,
        updatedAt: now,
      },
    });

    await this.prisma.ad.updateMany({
      where: {
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
        isActive: false,
        NOT: { status: AdStatus.inactive },
      },
      data: {
        status: AdStatus.inactive,
        updatedAt: now,
      },
    });
  }

  async create(createAdDto: CreateAdDto, authorId: string): Promise<AdResponse> {
    const author = await this.prisma.admin.findUnique({
      where: { id: authorId },
    });
    if (!author) throw new NotFoundException('Author not found');

    const inputIsActive =
      this.parseOptionalBoolean(createAdDto.isActive) ?? true;
    const startDate = this.parseOptionalDate(createAdDto.startDate);
    const endDate = this.parseOptionalDate(createAdDto.endDate);
    const computedStatus = this.resolveStatus(
      startDate,
      endDate,
      inputIsActive,
    );

    const ad = await this.prisma.ad.create({
      data: {
        id: createObjectIdString(),
        image: createAdDto.image || '',
        authorId,
        name: createAdDto.name,
        targetUrl: createAdDto.targetUrl,
        startDate: startDate ?? new Date(),
        endDate,
        isActive:
          computedStatus === AdStatus.pending ||
          computedStatus === AdStatus.expired
            ? false
            : inputIsActive,
        status: computedStatus,
      },
      include: adInclude,
    });

    const adResponse = this.toAdResponse(ad);
    const authorName = author.displayName || author.username || 'Admin';

    try {
      await this.notificationGateway.emitAdCreated(adResponse, authorName);
    } catch (e: unknown) {
      console.error(
        'Ad notification failed:',
        e instanceof Error ? e.message : String(e),
      );
    }

    return adResponse;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters: AdFindAllFilters = {},
  ): Promise<{
    data: AdResponse[];
    total: number;
    page: number;
    pages: number;
  }> {
    await this.syncLifecycleStatuses();
    const skip = (page - 1) * limit;
    const where = this.buildWhere(filters);

    const [data, total] = await Promise.all([
      this.prisma.ad.findMany({
        where,
        include: adInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.ad.count({ where }),
    ]);

    return {
      data: data.map((ad) => this.toAdResponse(ad)),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<AdResponse> {
    await this.syncLifecycleStatuses();

    const ad = await this.prisma.ad.findUnique({
      where: { id },
      include: adInclude,
    });

    if (!ad) throw new NotFoundException('Ad not found');
    return this.toAdResponse(ad);
  }

  async findExpiringAds(now: Date, in3Days: Date): Promise<AdResponse[]> {
    const ads = await this.prisma.ad.findMany({
      where: {
        isActive: true,
        endDate: { gte: now, lte: in3Days },
      },
      include: adInclude,
      orderBy: { endDate: 'asc' },
    });

    return ads.map((ad) => this.toAdResponse(ad));
  }

  async update(
    id: string,
    updateAdDto: UpdateAdDto,
    authorName: string = 'Admin',
  ): Promise<AdResponse> {
    const oldAd = await this.prisma.ad.findUnique({
      where: { id },
      include: adInclude,
    });
    if (!oldAd) throw new NotFoundException('Ad not found');

    const oldImage = oldAd.image || '';
    const shouldRemoveImage = updateAdDto.removeImage === 'true';
    const hasNewImage = !!updateAdDto.image;
    const parsedIsActive = this.parseOptionalBoolean(updateAdDto.isActive);
    const startDate =
      this.parseOptionalDate(updateAdDto.startDate) ?? oldAd.startDate;
    const endDate =
      this.parseOptionalDate(updateAdDto.endDate) ?? oldAd.endDate;
    const nextIsActive =
      parsedIsActive !== undefined ? parsedIsActive : oldAd.isActive;
    const computedStatus = this.resolveStatus(
      startDate,
      endDate,
      nextIsActive,
    );

    const updateData: Prisma.AdUncheckedUpdateInput = {
      updatedAt: new Date(),
      status: computedStatus,
    };

    if (updateAdDto.name !== undefined) updateData.name = updateAdDto.name;
    if (updateAdDto.targetUrl !== undefined) {
      updateData.targetUrl = updateAdDto.targetUrl;
    }
    if (updateAdDto.startDate !== undefined) updateData.startDate = startDate;
    if (updateAdDto.endDate !== undefined) updateData.endDate = endDate;
    if (parsedIsActive !== undefined) updateData.isActive = parsedIsActive;
    if (hasNewImage) updateData.image = updateAdDto.image;
    if (shouldRemoveImage) updateData.image = '';

    if (
      computedStatus === AdStatus.pending ||
      computedStatus === AdStatus.expired
    ) {
      updateData.isActive = false;
    }

    const ad = await this.prisma.ad.update({
      where: { id },
      data: updateData,
      include: adInclude,
    });
    const adResponse = this.toAdResponse(ad);

    try {
      if ((shouldRemoveImage || hasNewImage) && oldImage.trim() !== '') {
        const replacedWithDifferentImage =
          hasNewImage && oldImage !== ad.image;
        if (shouldRemoveImage || replacedWithDifferentImage) {
          this.deleteMediaFileIfExists(oldImage);
        }
      }
    } catch (fileError) {
      console.error('Failed to delete replaced/removed ad image:', fileError);
    }

    try {
      if (oldAd.isActive !== ad.isActive) {
        await this.notificationGateway.emitAdToggled(adResponse, authorName);
      } else {
        await this.notificationGateway.emitAdUpdated(adResponse, authorName);
      }
    } catch (e: unknown) {
      console.error(
        'Ad notification failed:',
        e instanceof Error ? e.message : String(e),
      );
    }

    return adResponse;
  }

  async updateImage(id: string, imagePath: string): Promise<AdResponse> {
    const ad = await this.prisma.ad.update({
      where: { id },
      data: { image: imagePath, updatedAt: new Date() },
      include: adInclude,
    }).catch(() => null);

    if (!ad) throw new NotFoundException('Ad not found');
    return this.toAdResponse(ad);
  }

  async toggleActive(
    id: string,
    authorName: string = 'Admin',
  ): Promise<AdResponse> {
    const existingAd = await this.prisma.ad.findUnique({
      where: { id },
      include: adInclude,
    });
    if (!existingAd) throw new NotFoundException('Ad not found');

    return this.update(id, { isActive: !existingAd.isActive }, authorName);
  }

  async delete(
    id: string,
    authorName: string = 'Admin',
  ): Promise<AdResponse> {
    const ad = await this.prisma.ad.findUnique({
      where: { id },
      include: adInclude,
    });
    if (!ad) throw new NotFoundException('Ad not found');

    try {
      this.deleteMediaFileIfExists(ad.image);
    } catch (e: unknown) {
      console.error(
        'Ad image delete failed:',
        e instanceof Error ? e.message : String(e),
      );
    }

    await this.prisma.ad.delete({ where: { id } });

    try {
      await this.notificationGateway.emitAdDeleted(ad.name, authorName);
    } catch (e: unknown) {
      console.error(
        'Ad notification failed:',
        e instanceof Error ? e.message : String(e),
      );
    }

    return this.toAdResponse(ad);
  }
}

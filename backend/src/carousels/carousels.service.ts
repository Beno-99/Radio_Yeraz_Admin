// src/carousels/carousels.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  Carousel as PrismaCarousel,
  CarouselStatus,
  Admin as PrismaAdmin,
  AdminRole,
  Prisma,
} from '@prisma/client';
import { Role } from '../admin/schemas/admin.schema';
import {
  deleteUploadFileIfExists,
  normalizeStoredMediaPath,
  normalizeStoredMediaPathForResponse,
} from '../common/uploads/uploads-paths';
import { createObjectIdString } from '../common/utils/object-id.utils';
import { NotificationGateway } from '../notifications/notification.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCarouselDto } from './dto/create-carousel.dto';
import { UpdateCarouselDto } from './dto/update-carousel.dto';

const carouselAuthorSelect = {
  id: true,
  username: true,
  displayName: true,
  role: true,
} satisfies Prisma.AdminSelect;

const carouselInclude = {
  author: { select: carouselAuthorSelect },
} satisfies Prisma.CarouselInclude;

type CarouselWithAuthor = Prisma.CarouselGetPayload<{
  include: typeof carouselInclude;
}>;

export interface CarouselAuthorResponse
  extends Omit<Pick<PrismaAdmin, 'id' | 'username' | 'displayName'>, never> {
  _id: string;
  role: Role;
}

export interface CarouselResponse extends Omit<PrismaCarousel, 'authorId' | 'author'> {
  _id: string;
  author: CarouselAuthorResponse | null;
  __v: number;
}

export interface CarouselFindAllFilters {
  isActive?: boolean;
  status?: CarouselStatus;
  startDateLte?: Date;
  endDateGte?: Date;
}

@Injectable()
export class CarouselsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  private toApiRole(role: AdminRole): Role {
    return role === AdminRole.SUPER_ADMIN ? Role.SUPER_ADMIN : Role.ADMIN;
  }

  private toCarouselResponse(carousel: CarouselWithAuthor): CarouselResponse {
    return {
      id: carousel.id,
      _id: carousel.id,
      image: normalizeStoredMediaPathForResponse(carousel.image),
      isActive: carousel.isActive,
      status: carousel.status,
      clicks: carousel.clicks,
      startDate: carousel.startDate,
      endDate: carousel.endDate,
      targetUrl: carousel.targetUrl,
      name: carousel.name,
      displayOrder: carousel.displayOrder,
      createdAt: carousel.createdAt,
      updatedAt: carousel.updatedAt,
      author: carousel.author
        ? {
            id: carousel.author.id,
            _id: carousel.author.id,
            username: carousel.author.username,
            displayName: carousel.author.displayName,
            role: this.toApiRole(carousel.author.role),
          }
        : null,
      __v: 0,
    };
  }

  private deleteMediaFileIfExists(filePath?: string): void {
    deleteUploadFileIfExists(filePath);
  }

  private normalizeCarouselImagePath(filePath?: string | null): string {
    try {
      return normalizeStoredMediaPath(filePath);
    } catch {
      throw new BadRequestException('Invalid carousel image path');
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

  private parseOptionalInteger(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }

    const parsed =
      typeof value === 'number' ? value : Number.parseInt(String(value), 10);

    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private resolveStatus(
    startDate: Date | string | null | undefined,
    endDate: Date | string | null | undefined,
    isActive: boolean,
  ): CarouselStatus {
    const now = new Date();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (end && !Number.isNaN(end.getTime()) && now > end) {
      return CarouselStatus.expired;
    }
    if (start && !Number.isNaN(start.getTime()) && now < start) {
      return CarouselStatus.pending;
    }
    return isActive ? CarouselStatus.active : CarouselStatus.inactive;
  }

  private buildWhere(filters: CarouselFindAllFilters): Prisma.CarouselWhereInput {
    const where: Prisma.CarouselWhereInput = {};

    if (filters.isActive !== undefined) where.isActive = filters.isActive;
    if (filters.status !== undefined) where.status = filters.status;
    if (filters.startDateLte !== undefined) {
      where.startDate = { lte: filters.startDateLte };
    }
    if (filters.endDateGte !== undefined) {
      where.OR = [{ endDate: null }, { endDate: { gte: filters.endDateGte } }];
    }

    return where;
  }

  async syncLifecycleStatuses(): Promise<void> {
    const now = new Date();

    await this.prisma.carousel.updateMany({
      where: {
        endDate: { lt: now },
        NOT: { status: CarouselStatus.expired },
      },
      data: {
        status: CarouselStatus.expired,
        isActive: false,
        updatedAt: now,
      },
    });

    await this.prisma.carousel.updateMany({
      where: {
        startDate: { gt: now },
        NOT: { status: CarouselStatus.pending },
      },
      data: {
        status: CarouselStatus.pending,
        isActive: false,
        updatedAt: now,
      },
    });

    await this.prisma.carousel.updateMany({
      where: {
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
        isActive: true,
        NOT: { status: CarouselStatus.active },
      },
      data: {
        status: CarouselStatus.active,
        updatedAt: now,
      },
    });

    await this.prisma.carousel.updateMany({
      where: {
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
        isActive: false,
        NOT: { status: CarouselStatus.inactive },
      },
      data: {
        status: CarouselStatus.inactive,
        updatedAt: now,
      },
    });
  }

  async create(createCarouselDto: CreateCarouselDto, authorId: string): Promise<CarouselResponse> {
    const author = await this.prisma.admin.findUnique({
      where: { id: authorId },
    });
    if (!author) throw new NotFoundException('Author not found');

    const inputIsActive =
      this.parseOptionalBoolean(createCarouselDto.isActive) ?? true;
    const startDate = this.parseOptionalDate(createCarouselDto.startDate);
    const endDate = this.parseOptionalDate(createCarouselDto.endDate);
    const computedStatus = this.resolveStatus(
      startDate,
      endDate,
      inputIsActive,
    );

    const carousel = await this.prisma.carousel.create({
      data: {
        id: createObjectIdString(),
        image: this.normalizeCarouselImagePath(createCarouselDto.image),
        authorId,
        name: createCarouselDto.name,
        targetUrl: createCarouselDto.targetUrl,
        displayOrder: this.parseOptionalInteger(createCarouselDto.displayOrder) ?? 0,
        startDate: startDate ?? new Date(),
        endDate,
        isActive:
          computedStatus === CarouselStatus.pending ||
          computedStatus === CarouselStatus.expired
            ? false
            : inputIsActive,
        status: computedStatus,
      },
      include: carouselInclude,
    });

    const carouselResponse = this.toCarouselResponse(carousel);
    const authorName = author.displayName || author.username || 'Admin';

    try {
      await this.notificationGateway.emitCarouselCreated(
        carouselResponse,
        authorName,
        authorId,
      );
    } catch (e: unknown) {
      console.error(
        'Carousel notification failed:',
        e instanceof Error ? e.message : String(e),
      );
    }

    return carouselResponse;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters: CarouselFindAllFilters = {},
  ): Promise<{
    data: CarouselResponse[];
    total: number;
    page: number;
    pages: number;
  }> {
    await this.syncLifecycleStatuses();
    const skip = (page - 1) * limit;
    const where = this.buildWhere(filters);

    const [data, total] = await Promise.all([
      this.prisma.carousel.findMany({
        where,
        include: carouselInclude,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.carousel.count({ where }),
    ]);

    return {
      data: data.map((carousel) => this.toCarouselResponse(carousel)),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<CarouselResponse> {
    await this.syncLifecycleStatuses();

    const carousel = await this.prisma.carousel.findUnique({
      where: { id },
      include: carouselInclude,
    });

    if (!carousel) throw new NotFoundException('Carousel not found');
    return this.toCarouselResponse(carousel);
  }

  async findExpiringCarousels(now: Date, in3Days: Date): Promise<CarouselResponse[]> {
    const carousels = await this.prisma.carousel.findMany({
      where: {
        isActive: true,
        endDate: { gte: now, lte: in3Days },
      },
      include: carouselInclude,
      orderBy: { endDate: 'asc' },
    });

    return carousels.map((carousel) => this.toCarouselResponse(carousel));
  }

  async update(
    id: string,
    updateCarouselDto: UpdateCarouselDto,
    authorName: string = 'Admin',
    authorId?: string,
  ): Promise<CarouselResponse> {
    const oldCarousel = await this.prisma.carousel.findUnique({
      where: { id },
      include: carouselInclude,
    });
    if (!oldCarousel) throw new NotFoundException('Carousel not found');

    const oldImage = oldCarousel.image || '';
    const shouldRemoveImage = updateCarouselDto.removeImage === 'true';
    const hasNewImage = !!updateCarouselDto.image;
    const parsedIsActive = this.parseOptionalBoolean(updateCarouselDto.isActive);
    const startDate =
      this.parseOptionalDate(updateCarouselDto.startDate) ?? oldCarousel.startDate;
    const endDate =
      this.parseOptionalDate(updateCarouselDto.endDate) ?? oldCarousel.endDate;
    const nextIsActive =
      parsedIsActive !== undefined ? parsedIsActive : oldCarousel.isActive;
    const computedStatus = this.resolveStatus(
      startDate,
      endDate,
      nextIsActive,
    );

    const updateData: Prisma.CarouselUncheckedUpdateInput = {
      updatedAt: new Date(),
      status: computedStatus,
    };

    if (updateCarouselDto.name !== undefined) updateData.name = updateCarouselDto.name;
    if (updateCarouselDto.targetUrl !== undefined) {
      updateData.targetUrl = updateCarouselDto.targetUrl;
    }
    if (updateCarouselDto.displayOrder !== undefined) {
      updateData.displayOrder =
        this.parseOptionalInteger(updateCarouselDto.displayOrder) ?? 0;
    }
    if (updateCarouselDto.startDate !== undefined) updateData.startDate = startDate;
    if (updateCarouselDto.endDate !== undefined) updateData.endDate = endDate;
    if (parsedIsActive !== undefined) updateData.isActive = parsedIsActive;
    if (hasNewImage) {
      updateData.image = this.normalizeCarouselImagePath(updateCarouselDto.image);
    }
    if (shouldRemoveImage) updateData.image = '';

    if (
      computedStatus === CarouselStatus.pending ||
      computedStatus === CarouselStatus.expired
    ) {
      updateData.isActive = false;
    }

    const carousel = await this.prisma.carousel.update({
      where: { id },
      data: updateData,
      include: carouselInclude,
    });
    const carouselResponse = this.toCarouselResponse(carousel);

    try {
      if ((shouldRemoveImage || hasNewImage) && oldImage.trim() !== '') {
        const replacedWithDifferentImage =
          hasNewImage && oldImage !== carousel.image;
        if (shouldRemoveImage || replacedWithDifferentImage) {
          this.deleteMediaFileIfExists(oldImage);
        }
      }
    } catch (fileError) {
      console.error('Failed to delete replaced/removed carousel image:', fileError);
    }

    try {
      if (oldCarousel.isActive !== carousel.isActive) {
        await this.notificationGateway.emitCarouselToggled(
          carouselResponse,
          authorName,
          authorId,
        );
      } else {
        await this.notificationGateway.emitCarouselUpdated(
          carouselResponse,
          authorName,
          authorId,
        );
      }
    } catch (e: unknown) {
      console.error(
        'Carousel notification failed:',
        e instanceof Error ? e.message : String(e),
      );
    }

    return carouselResponse;
  }

  async updateImage(id: string, imagePath: string): Promise<CarouselResponse> {
    const carousel = await this.prisma.carousel.update({
      where: { id },
      data: {
        image: this.normalizeCarouselImagePath(imagePath),
        updatedAt: new Date(),
      },
      include: carouselInclude,
    }).catch(() => null);

    if (!carousel) throw new NotFoundException('Carousel not found');
    return this.toCarouselResponse(carousel);
  }

  async toggleActive(
    id: string,
    authorName: string = 'Admin',
    authorId?: string,
  ): Promise<CarouselResponse> {
    const existingCarousel = await this.prisma.carousel.findUnique({
      where: { id },
      include: carouselInclude,
    });
    if (!existingCarousel) throw new NotFoundException('Carousel not found');

    return this.update(
      id,
      { isActive: !existingCarousel.isActive },
      authorName,
      authorId,
    );
  }

  async delete(
    id: string,
    authorName: string = 'Admin',
    authorId?: string,
  ): Promise<CarouselResponse> {
    const carousel = await this.prisma.carousel.findUnique({
      where: { id },
      include: carouselInclude,
    });
    if (!carousel) throw new NotFoundException('Carousel not found');

    try {
      this.deleteMediaFileIfExists(carousel.image);
    } catch (e: unknown) {
      console.error(
        'Carousel image delete failed:',
        e instanceof Error ? e.message : String(e),
      );
    }

    await this.prisma.carousel.delete({ where: { id } });

    try {
      await this.notificationGateway.emitCarouselDeleted(
        carousel.name,
        authorName,
        authorId,
      );
    } catch (e: unknown) {
      console.error(
        'Carousel notification failed:',
        e instanceof Error ? e.message : String(e),
      );
    }

    return this.toCarouselResponse(carousel);
  }
}

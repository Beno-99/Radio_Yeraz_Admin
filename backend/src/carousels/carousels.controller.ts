// src/carousels/carousels.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CarouselStatus } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import {
  ensureCarouselImagesDirectory,
  getCarouselImageWebPath,
} from '../common/uploads/uploads-paths';
import { Role } from '../admin/schemas/admin.schema';
import { CarouselFindAllFilters, CarouselsService } from './carousels.service';
import { CreateCarouselDto } from './dto/create-carousel.dto';
import { UpdateCarouselDto } from './dto/update-carousel.dto';

interface CarouselsQuery {
  page?: string;
  limit?: string;
  isActive?: string;
  status?: string;
}

@Controller('carousels')
export class CarouselsController {
  constructor(private readonly carouselsService: CarouselsService) {}

  private parseCarouselStatus(status?: string): CarouselStatus | undefined {
    switch (status) {
      case CarouselStatus.pending:
        return CarouselStatus.pending;
      case CarouselStatus.active:
        return CarouselStatus.active;
      case CarouselStatus.inactive:
        return CarouselStatus.inactive;
      case CarouselStatus.expired:
        return CarouselStatus.expired;
      default:
        return undefined;
    }
  }

  @Get()
  async getAllCarousels(@Query() query: CarouselsQuery) {
    const page = parseInt(query.page || '1', 10) || 1;
    const limit = parseInt(query.limit || '10', 10) || 10;

    const filters: CarouselFindAllFilters = {};
    if (query.isActive !== undefined) {
      filters.isActive = query.isActive === 'true';
    }

    const status = this.parseCarouselStatus(query.status);
    if (status) {
      filters.status = status;
    }

    const result = await this.carouselsService.findAll(page, limit, filters);
    return { success: true, ...result };
  }

  @Get('public')
  async getPublicCarousels(@Query() query: CarouselsQuery) {
    const page = parseInt(query.page || '1', 10) || 1;
    const limit = parseInt(query.limit || '10', 10) || 10;
    const now = new Date();

    const filters: CarouselFindAllFilters = {
      isActive: true,
      status: CarouselStatus.active,
      startDateLte: now,
      endDateGte: now,
    };

    const result = await this.carouselsService.findAll(page, limit, filters);
    return { success: true, ...result };
  }

  @Get(':id')
  async getCarousel(@Param('id') id: string) {
    const carousel = await this.carouselsService.findOne(id);
    return { success: true, data: carousel };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, ensureCarouselImagesDirectory());
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `carousel-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async createCarousel(
    @Req() req: AuthenticatedRequest,
    @Body() createCarouselDto: CreateCarouselDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Image file is required');

    createCarouselDto.image = getCarouselImageWebPath(file.filename);
    const carousel = await this.carouselsService.create(createCarouselDto, req.user.sub);

    return {
      success: true,
      message: 'Carousel created successfully',
      data: carousel,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, ensureCarouselImagesDirectory());
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `carousel-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async updateCarousel(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateCarouselDto: UpdateCarouselDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const authorName = req.user.displayName || req.user.username || 'Admin';

    if (file) {
      updateCarouselDto.image = getCarouselImageWebPath(file.filename);
    }

    const carousel = await this.carouselsService.update(
      id,
      updateCarouselDto,
      authorName,
      req.user.sub,
    );
    return {
      success: true,
      message: 'Carousel updated successfully',
      data: carousel,
    };
  }

  @Post(':id/upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          cb(null, ensureCarouselImagesDirectory());
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `carousel-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only image files are allowed!'), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadCarouselImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Image file is required');

    const imagePath = getCarouselImageWebPath(file.filename);
    const updatedCarousel = await this.carouselsService.updateImage(id, imagePath);

    return {
      success: true,
      message: 'Image uploaded successfully',
      data: { image: imagePath, carousel: updatedCarousel },
    };
  }

  @Put(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async toggleActive(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const authorName = req.user.displayName || req.user.username || 'Admin';
    const carousel = await this.carouselsService.toggleActive(
      id,
      authorName,
      req.user.sub,
    );

    return {
      success: true,
      message: `Carousel ${carousel.isActive ? 'activated' : 'deactivated'} successfully`,
      data: carousel,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async deleteCarousel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const authorName = req.user.displayName || req.user.username || 'Admin';
    await this.carouselsService.delete(id, authorName, req.user.sub);

    return {
      success: true,
      message: 'Carousel deleted successfully',
    };
  }
}

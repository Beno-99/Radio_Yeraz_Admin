// src/ads/ads.controller.ts
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
import { AdStatus } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../admin/schemas/admin.schema';
import { AdFindAllFilters, AdsService } from './ads.service';
import { CreateAdDto } from './dto/create-ad.dto';
import { UpdateAdDto } from './dto/update-ad.dto';

interface AdsQuery {
  page?: string;
  limit?: string;
  isActive?: string;
  status?: string;
}

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  private parseAdStatus(status?: string): AdStatus | undefined {
    switch (status) {
      case AdStatus.pending:
        return AdStatus.pending;
      case AdStatus.active:
        return AdStatus.active;
      case AdStatus.inactive:
        return AdStatus.inactive;
      case AdStatus.expired:
        return AdStatus.expired;
      default:
        return undefined;
    }
  }

  @Get()
  async getAllAds(@Query() query: AdsQuery) {
    const page = parseInt(query.page || '1', 10) || 1;
    const limit = parseInt(query.limit || '10', 10) || 10;

    const filters: AdFindAllFilters = {};
    if (query.isActive !== undefined) {
      filters.isActive = query.isActive === 'true';
    }

    const status = this.parseAdStatus(query.status);
    if (status) {
      filters.status = status;
    }

    const result = await this.adsService.findAll(page, limit, filters);
    return { success: true, ...result };
  }

  @Get('public')
  async getPublicAds(@Query() query: AdsQuery) {
    const page = parseInt(query.page || '1', 10) || 1;
    const limit = parseInt(query.limit || '10', 10) || 10;
    const now = new Date();

    const filters: AdFindAllFilters = {
      isActive: true,
      status: AdStatus.active,
      startDateLte: now,
      endDateGte: now,
    };

    const result = await this.adsService.findAll(page, limit, filters);
    return { success: true, ...result };
  }

  @Get(':id')
  async getAd(@Param('id') id: string) {
    const ad = await this.adsService.findOne(id);
    return { success: true, data: ad };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/ads';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `ad-${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  async createAd(
    @Req() req: AuthenticatedRequest,
    @Body() createAdDto: CreateAdDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Image file is required');

    createAdDto.image = `/uploads/ads/${file.filename}`;
    const ad = await this.adsService.create(createAdDto, req.user.sub);

    return {
      success: true,
      message: 'Ad created successfully',
      data: ad,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/ads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `ad-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async updateAd(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateAdDto: UpdateAdDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const authorName = req.user.displayName || req.user.username || 'Admin';

    if (file) {
      updateAdDto.image = `/uploads/ads/${file.filename}`;
    }

    const ad = await this.adsService.update(id, updateAdDto, authorName);
    return {
      success: true,
      message: 'Ad updated successfully',
      data: ad,
    };
  }

  @Post(':id/upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads/ads';
          if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `ad-${uniqueSuffix}${ext}`);
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
  async uploadAdImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Image file is required');

    const imagePath = `/uploads/ads/${file.filename}`;
    const updatedAd = await this.adsService.updateImage(id, imagePath);

    return {
      success: true,
      message: 'Image uploaded successfully',
      data: { image: imagePath, ad: updatedAd },
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
    const ad = await this.adsService.toggleActive(id, authorName);

    return {
      success: true,
      message: `Ad ${ad.isActive ? 'activated' : 'deactivated'} successfully`,
      data: ad,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async deleteAd(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const authorName = req.user.displayName || req.user.username || 'Admin';
    await this.adsService.delete(id, authorName);

    return {
      success: true,
      message: 'Ad deleted successfully',
    };
  }
}

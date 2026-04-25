import {
  Controller,
  Post,
  Get,
  Delete,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Param,
  ParseUUIDPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { UploadResponse } from './interfaces/upload-response.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../admin/schemas/admin.schema';
import path from 'path';
import fs from 'fs';

@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('single')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSingle(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponse> {
    return this.uploadService.uploadFile(file);
  }

  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  async uploadMultiple(
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<UploadResponse[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const uploadPromises = files.map((file) =>
      this.uploadService.uploadFile(file),
    );

    return Promise.all(uploadPromises);
  }

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp|svg\+xml)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponse> {
    return this.uploadService.uploadFile(file);
  }

  @Post('video')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(mp4|webm|mov|avi|mkv|flv|wmv)$/)) {
          return callback(
            new BadRequestException('Only video files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponse> {
    return this.uploadService.uploadFile(file);
  }

  @Delete(':filename')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async deleteFile(
    @Param('filename') filename: string,
  ): Promise<{ message: string }> {
    await this.uploadService.deleteFile(filename);
    return { message: 'File deleted successfully' };
  }

  @Get('stats')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getStats() {
    const stats = {
      images: this.getFolderStats('images'),
      videos: this.getFolderStats('videos'),
      documents: this.getFolderStats('documents'),
    };

    return stats;
  }

  private getFolderStats(folder: string) {
    const folderPath = path.join(this.uploadService['uploadBasePath'], folder);

    if (!fs.existsSync(folderPath)) {
      return { count: 0, totalSize: 0 };
    }

    const files = fs.readdirSync(folderPath);
    let totalSize = 0;

    files.forEach((file) => {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);
      totalSize += stats.size;
    });

    return {
      count: files.length,
      totalSize,
      formattedSize: this.formatBytes(totalSize),
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

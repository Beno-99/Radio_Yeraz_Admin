import { Injectable, BadRequestException } from '@nestjs/common';
import { UploadResponse } from './interfaces/upload-response.interface';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import {
  deleteUploadFileIfExists,
  ensureCommonUploadDirectories,
  ensureUploadsDirectory,
  getGenericDocumentWebPath,
  getGenericImageWebPath,
  getGenericVideoWebPath,
  getUploadsDirectory,
} from '../common/uploads/uploads-paths';

@Injectable()
export class UploadService {
  constructor() {
    // Ensure upload directories exist
    this.ensureUploadDirectories();
  }

  private ensureUploadDirectories() {
    ensureCommonUploadDirectories();
  }

  private generateUniqueFilename(originalname: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalname);
    const nameWithoutExt = path.basename(originalname, extension);

    // Remove special characters and spaces
    const cleanName = nameWithoutExt
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    return `${cleanName}-${timestamp}-${randomString}${extension}`;
  }

  private getDestinationFolder(mimetype: string): string {
    if (mimetype.startsWith('image/')) {
      return 'images';
    } else if (mimetype.startsWith('video/')) {
      return 'videos';
    } else {
      return 'documents';
    }
  }

  async uploadFile(file: Express.Multer.File): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file size (max 10MB for images, 100MB for videos)
    const maxSize = file.mimetype.startsWith('image/')
      ? 10 * 1024 * 1024
      : 100 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new BadRequestException(
        `File too large. Max size: ${maxSize / (1024 * 1024)}MB`,
      );
    }

    const folder = this.getDestinationFolder(file.mimetype);
    const filename = this.generateUniqueFilename(file.originalname);
    const destinationPath = ensureUploadsDirectory(folder);

    // Move file to destination
    const filePath = path.join(destinationPath, filename);
    fs.writeFileSync(filePath, file.buffer);
    const url =
      folder === 'images'
        ? getGenericImageWebPath(filename)
        : folder === 'videos'
          ? getGenericVideoWebPath(filename)
          : getGenericDocumentWebPath(filename);

    return {
      url,
      filename: filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    };
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      deleteUploadFileIfExists(fileUrl);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new BadRequestException('Failed to delete file');
    }
  }

  getFolderPath(folder: string): string {
    return getUploadsDirectory(folder);
  }
}

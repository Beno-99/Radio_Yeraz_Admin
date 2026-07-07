import { Injectable, NotFoundException } from '@nestjs/common';
import { StreamLink as PrismaStreamLink } from '@prisma/client';
import { createObjectIdString } from '../common/utils/object-id.utils';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStreamLinkDto } from './dto/create-stream-link.dto';
import { UpdateStreamLinkDto } from './dto/update-stream-link.dto';

export interface StreamLinkResponse extends PrismaStreamLink {
  _id: string;
  __v: number;
}

@Injectable()
export class StreamLinkService {
  constructor(private readonly prisma: PrismaService) {}

  private toStreamLinkResponse(
    streamLink: PrismaStreamLink,
  ): StreamLinkResponse {
    return {
      ...streamLink,
      _id: streamLink.id,
      __v: 0,
    };
  }

  async create(dto: CreateStreamLinkDto): Promise<StreamLinkResponse> {
    const created = await this.prisma.streamLink.create({
      data: {
        id: createObjectIdString(),
        title: dto.title,
        url: dto.url,
        metadataUrl: dto.metadataUrl ?? null,
        description: dto.description,
        bitrate: dto.bitrate ?? null,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    return this.toStreamLinkResponse(created);
  }

  async findAll(): Promise<StreamLinkResponse[]> {
    const streamLinks = await this.prisma.streamLink.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return streamLinks.map((streamLink) =>
      this.toStreamLinkResponse(streamLink),
    );
  }

  async findActive(): Promise<StreamLinkResponse[]> {
    const streamLinks = await this.prisma.streamLink.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return streamLinks.map((streamLink) =>
      this.toStreamLinkResponse(streamLink),
    );
  }

  async findOne(id: string): Promise<StreamLinkResponse> {
    const streamLink = await this.prisma.streamLink.findUnique({
      where: { id },
    });

    if (!streamLink) {
      throw new NotFoundException(`Stream link with ID ${id} not found`);
    }

    return this.toStreamLinkResponse(streamLink);
  }

  async update(
    id: string,
    dto: UpdateStreamLinkDto,
  ): Promise<StreamLinkResponse> {
    const existing = await this.prisma.streamLink.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Stream link with ID ${id} not found`);
    }

    const updated = await this.prisma.streamLink.update({
      where: { id },
      data: {
        title: dto.title,
        url: dto.url,
        metadataUrl: dto.metadataUrl,
        description: dto.description,
        bitrate: dto.bitrate,
        displayOrder: dto.displayOrder,
        isActive: dto.isActive,
        updatedAt: new Date(),
      },
    });

    return this.toStreamLinkResponse(updated);
  }

  async remove(id: string): Promise<void> {
    const result = await this.prisma.streamLink.deleteMany({
      where: { id },
    });

    if (result.count === 0) {
      throw new NotFoundException(`Stream link with ID ${id} not found`);
    }
  }
}

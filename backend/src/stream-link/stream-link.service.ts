import { Injectable, NotFoundException } from '@nestjs/common';
import {
  Admin as PrismaAdmin,
  AdminRole,
  Prisma,
  StreamLink as PrismaStreamLink,
} from '@prisma/client';
import { Role } from '../admin/schemas/admin.schema';
import { createObjectIdString } from '../common/utils/object-id.utils';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStreamLinkDto } from './dto/create-stream-link.dto';
import { UpdateStreamLinkDto } from './dto/update-stream-link.dto';

const streamLinkAuthorSelect = {
  id: true,
  username: true,
  displayName: true,
  role: true,
} satisfies Prisma.AdminSelect;

const streamLinkInclude = {
  author: { select: streamLinkAuthorSelect },
} satisfies Prisma.StreamLinkInclude;

type StreamLinkWithAuthor = Prisma.StreamLinkGetPayload<{
  include: typeof streamLinkInclude;
}>;

interface StreamLinkDeletePermissionResult {
  allowed: boolean;
  message?: string;
}

interface StreamLinkEditPermissionResult {
  allowed: boolean;
  message?: string;
}

export interface StreamLinkAuthorResponse
  extends Pick<PrismaAdmin, 'id' | 'username' | 'displayName'> {
  _id: string;
  role: Role;
}

export interface StreamLinkResponse extends Omit<PrismaStreamLink, 'authorId'> {
  _id: string;
  author: StreamLinkAuthorResponse | null;
  __v: number;
}

@Injectable()
export class StreamLinkService {
  constructor(private readonly prisma: PrismaService) {}

  private toApiRole(role: AdminRole): Role {
    return role === AdminRole.SUPER_ADMIN ? Role.SUPER_ADMIN : Role.ADMIN;
  }

  private toStreamLinkResponse(streamLink: StreamLinkWithAuthor): StreamLinkResponse {
    return {
      id: streamLink.id,
      _id: streamLink.id,
      title: streamLink.title,
      url: streamLink.url,
      metadataUrl: streamLink.metadataUrl,
      description: streamLink.description,
      bitrate: streamLink.bitrate,
      displayOrder: streamLink.displayOrder,
      isActive: streamLink.isActive,
      createdAt: streamLink.createdAt,
      updatedAt: streamLink.updatedAt,
      author: streamLink.author
        ? {
            id: streamLink.author.id,
            _id: streamLink.author.id,
            username: streamLink.author.username,
            displayName: streamLink.author.displayName,
            role: this.toApiRole(streamLink.author.role),
          }
        : null,
      __v: 0,
    };
  }

  async create(dto: CreateStreamLinkDto, authorId: string): Promise<StreamLinkResponse> {
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
        authorId,
      },
      include: streamLinkInclude,
    });

    return this.toStreamLinkResponse(created);
  }

  async findAll(): Promise<StreamLinkResponse[]> {
    const streamLinks = await this.prisma.streamLink.findMany({
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: streamLinkInclude,
    });

    return streamLinks.map((streamLink) =>
      this.toStreamLinkResponse(streamLink),
    );
  }

  async findActive(): Promise<StreamLinkResponse[]> {
    const streamLinks = await this.prisma.streamLink.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      include: streamLinkInclude,
    });

    return streamLinks.map((streamLink) =>
      this.toStreamLinkResponse(streamLink),
    );
  }

  async findOne(id: string): Promise<StreamLinkResponse> {
    const streamLink = await this.prisma.streamLink.findUnique({
      where: { id },
      include: streamLinkInclude,
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
      include: streamLinkInclude,
    });

    return this.toStreamLinkResponse(updated);
  }

  async canAdminDeleteStreamLink(
    streamLinkId: string,
    adminId: string,
    adminRole: Role,
  ): Promise<StreamLinkDeletePermissionResult> {
    if (adminRole === Role.SUPER_ADMIN) return { allowed: true };

    if (adminRole === Role.ADMIN) {
      const streamLink = await this.prisma.streamLink.findUnique({
        where: { id: streamLinkId },
        select: {
          authorId: true,
          author: { select: { role: true } },
        },
      });
      if (!streamLink) {
        return {
          allowed: false,
          message: 'Stream link not found',
        };
      }

      if (streamLink.authorId === adminId) return { allowed: true };

      if (!streamLink.authorId) {
        return {
          allowed: false,
          message: "You can't delete this stream link.",
        };
      }

      if (streamLink.author?.role === AdminRole.SUPER_ADMIN) {
        return {
          allowed: false,
          message: "You can't delete a stream link created by a super admin.",
        };
      }

      return {
        allowed: false,
        message: "You can't delete a stream link created by another admin.",
      };
    }

    return {
      allowed: false,
      message: "You can't delete this stream link.",
    };
  }

  async canAdminEditStreamLink(
    streamLinkId: string,
    adminId: string,
    adminRole: Role,
  ): Promise<StreamLinkEditPermissionResult> {
    if (adminRole === Role.SUPER_ADMIN) return { allowed: true };

    if (adminRole === Role.ADMIN) {
      const streamLink = await this.prisma.streamLink.findUnique({
        where: { id: streamLinkId },
        select: {
          authorId: true,
          author: { select: { role: true } },
        },
      });
      if (!streamLink) {
        return {
          allowed: false,
          message: 'Stream link not found',
        };
      }

      if (streamLink.authorId === adminId) return { allowed: true };

      if (!streamLink.authorId) {
        return {
          allowed: false,
          message: "You can't edit this stream link.",
        };
      }

      if (streamLink.author?.role === AdminRole.SUPER_ADMIN) {
        return {
          allowed: false,
          message: "You can't edit a stream link created by a super admin.",
        };
      }

      return {
        allowed: false,
        message: "You can't edit a stream link created by another admin.",
      };
    }

    return {
      allowed: false,
      message: "You can't edit this stream link.",
    };
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

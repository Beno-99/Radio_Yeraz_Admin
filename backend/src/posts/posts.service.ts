import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Admin as PrismaAdmin,
  AdminRole,
  Post as PrismaPost,
  PostStatus,
  PostVideoSource,
  Prisma,
} from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { Role } from '../admin/schemas/admin.schema';
import {
  createObjectIdString,
  isObjectIdString,
} from '../common/utils/object-id.utils';
import { NotificationGateway } from '../notifications/notification.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { normalizeYoutubeUrl } from './youtube-url.util';

const postAuthorSelect = {
  id: true,
  username: true,
  displayName: true,
  role: true,
} satisfies Prisma.AdminSelect;

const postInclude = {
  author: { select: postAuthorSelect },
} satisfies Prisma.PostInclude;

type PostWithAuthor = Prisma.PostGetPayload<{ include: typeof postInclude }>;

export type PostSortField =
  | 'postedDate'
  | 'createdAt'
  | 'updatedAt'
  | 'eventDate'
  | 'title'
  | 'status';

export interface PostSortOptions {
  field: PostSortField;
  direction: Prisma.SortOrder;
}

export interface PostFindAllFilters {
  author?: string;
  isLive?: boolean;
  isPublished?: boolean;
  status?: PostStatus;
}

export interface PostAuthorResponse
  extends Pick<PrismaAdmin, 'id' | 'username' | 'displayName'> {
  _id: string;
  role: Role;
}

export interface PostResponse
  extends Omit<PrismaPost, 'authorId' | 'author'> {
  _id: string;
  author: PostAuthorResponse | null;
  __v: number;
}

export interface PostStatistics {
  total: number;
  live: number;
  draft: number;
  topAuthors: Array<{ _id: string | null; count: number }>;
  recentPosts: PostResponse[];
  postsByMonth: Array<{
    _id: { year: number; month: number };
    count: number;
  }>;
}

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  private toApiRole(role: AdminRole): Role {
    return role === AdminRole.SUPER_ADMIN ? Role.SUPER_ADMIN : Role.ADMIN;
  }

  private toPostResponse(post: PostWithAuthor): PostResponse {
    return {
      id: post.id,
      _id: post.id,
      title: post.title,
      description: post.description,
      mainImage: post.mainImage,
      video: post.video,
      videoSource: post.videoSource ?? (post.video ? PostVideoSource.UPLOAD : null),
      youtubeUrl: post.youtubeUrl,
      youtubeVideoId: post.youtubeVideoId,
      profileName: post.profileName,
      eventDate: post.eventDate,
      eventTime: post.eventTime,
      location: post.location,
      isLive: post.isLive,
      isPublished: post.isPublished,
      status: post.status,
      postedDate: post.postedDate,
      link: post.link,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      expiresAt: post.expiresAt,
      reminderSentAt: post.reminderSentAt,
      author: post.author
        ? {
            id: post.author.id,
            _id: post.author.id,
            username: post.author.username,
            displayName: post.author.displayName,
            role: this.toApiRole(post.author.role),
          }
        : null,
      __v: 0,
    };
  }

  private calculateExpiryFromEventDate(eventDate?: string | Date | null): Date | null {
    if (!eventDate) return null;
    const event = new Date(eventDate);
    if (Number.isNaN(event.getTime())) return null;
    return new Date(event.getTime() + 5 * 24 * 60 * 60 * 1000);
  }

  private parseOptionalDate(
    value: string | Date | null | undefined,
  ): Date | null | undefined {
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

  private buildOrderBy(
    sort: PostSortOptions,
  ): Prisma.PostOrderByWithRelationInput {
    switch (sort.field) {
      case 'createdAt':
        return { createdAt: sort.direction };
      case 'updatedAt':
        return { updatedAt: sort.direction };
      case 'eventDate':
        return { eventDate: sort.direction };
      case 'title':
        return { title: sort.direction };
      case 'status':
        return { status: sort.direction };
      case 'postedDate':
      default:
        return { postedDate: sort.direction };
    }
  }

  private buildFindAllWhere(
    filters: PostFindAllFilters,
    search?: string,
  ): Prisma.PostWhereInput {
    const where: Prisma.PostWhereInput = {};

    if (filters.author) where.authorId = filters.author;
    if (filters.isLive !== undefined) where.isLive = filters.isLive;
    if (filters.isPublished !== undefined) {
      where.isPublished = filters.isPublished;
    }
    if (filters.status !== undefined) where.status = filters.status;

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { location: { contains: search } },
        { profileName: { contains: search } },
      ];
    }

    return where;
  }

  async expirePostsPastEventWindow(): Promise<number> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.post.updateMany({
      where: {
        eventDate: { lte: cutoff },
        isPublished: true,
      },
      data: {
        isPublished: false,
        isLive: false,
        status: PostStatus.expired,
        updatedAt: now,
      },
    });

    return result.count;
  }

  async create(
    createPostDto: CreatePostDto & { author: string },
    authorId: string,
  ): Promise<PostResponse> {
    const author = await this.prisma.admin.findUnique({
      where: { id: authorId },
    });
    if (!author) throw new NotFoundException('Author not found');

    const isPublishedValue =
      this.parseOptionalBoolean(createPostDto.isPublished) ?? false;
    const isLiveValue = this.parseOptionalBoolean(createPostDto.isLive) ?? false;
    const eventDate = this.parseOptionalDate(createPostDto.eventDate);
    const calculatedExpiresAt = this.calculateExpiryFromEventDate(eventDate);
    const youtubeMedia = createPostDto.youtubeUrl?.trim()
      ? normalizeYoutubeUrl(createPostDto.youtubeUrl)
      : null;

    if (createPostDto.video) {
      throw new BadRequestException(
        'New uploaded videos are not supported. Use youtubeUrl instead.',
      );
    }

    const savedPost = await this.prisma.post.create({
      data: {
        id: createObjectIdString(),
        title: createPostDto.title,
        description: createPostDto.description,
        mainImage: createPostDto.mainImage || '',
        video: null,
        videoSource: youtubeMedia ? PostVideoSource.YOUTUBE : null,
        youtubeUrl: youtubeMedia?.youtubeUrl ?? null,
        youtubeVideoId: youtubeMedia?.youtubeVideoId ?? null,
        profileName: createPostDto.profileName || 'Radio Yeraz',
        eventDate,
        eventTime: createPostDto.eventTime,
        location: createPostDto.location,
        isLive: isLiveValue,
        isPublished: isPublishedValue,
        status: isPublishedValue ? PostStatus.published : PostStatus.draft,
        postedDate: new Date(),
        authorId,
        link: createPostDto.link,
        expiresAt:
          calculatedExpiresAt ||
          new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
      include: postInclude,
    });

    const postResponse = this.toPostResponse(savedPost);

    try {
      const authorName = author.displayName || author.username || 'Admin';

      if (savedPost.isPublished) {
        await this.notificationGateway.emitNewPost(postResponse, authorName);
      } else {
        await this.notificationGateway.emitNewDraft(postResponse, authorName);
      }
    } catch (notifError: unknown) {
      console.error(
        'Notification emit failed:',
        notifError instanceof Error ? notifError.message : String(notifError),
      );
    }

    return postResponse;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    filters: PostFindAllFilters = {},
    sort: PostSortOptions = { field: 'postedDate', direction: 'desc' },
    search?: string,
  ): Promise<{
    data: PostResponse[];
    total: number;
    page: number;
    pages: number;
  }> {
    await this.expirePostsPastEventWindow();

    const skip = (page - 1) * limit;
    const where = this.buildFindAllWhere(filters, search);
    const orderBy = this.buildOrderBy(sort);

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: postInclude,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.post.count({ where }),
    ]);

    return {
      data: data.map((post) => this.toPostResponse(post)),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<PostResponse> {
    await this.expirePostsPastEventWindow();

    if (!isObjectIdString(id)) {
      throw new BadRequestException('Invalid post id');
    }

    const post = await this.prisma.post.findUnique({
      where: { id },
      include: postInclude,
    });

    if (!post) throw new NotFoundException('Post not found');
    return this.toPostResponse(post);
  }

  async findByAuthor(authorId: string): Promise<PostResponse[]> {
    await this.expirePostsPastEventWindow();

    const posts = await this.prisma.post.findMany({
      where: { authorId },
      include: postInclude,
      orderBy: { postedDate: 'desc' },
    });

    return posts.map((post) => this.toPostResponse(post));
  }

  async findLivePosts(): Promise<PostResponse[]> {
    await this.expirePostsPastEventWindow();

    const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    const posts = await this.prisma.post.findMany({
      where: {
        isLive: true,
        isPublished: true,
        status: PostStatus.published,
        OR: [{ eventDate: null }, { eventDate: { gt: cutoff } }],
      },
      include: postInclude,
      orderBy: { postedDate: 'desc' },
    });

    return posts.map((post) => this.toPostResponse(post));
  }

  async findRecentPosts(limit: number = 5): Promise<PostResponse[]> {
    await this.expirePostsPastEventWindow();

    const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    const posts = await this.prisma.post.findMany({
      where: {
        isPublished: true,
        status: PostStatus.published,
        OR: [{ eventDate: null }, { eventDate: { gt: cutoff } }],
      },
      include: postInclude,
      orderBy: { postedDate: 'desc' },
      take: limit,
    });

    return posts.map((post) => this.toPostResponse(post));
  }

  async searchPosts(query: string, limit: number = 20): Promise<PostResponse[]> {
    await this.expirePostsPastEventWindow();

    const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    const posts = await this.prisma.post.findMany({
      where: {
        isPublished: true,
        status: PostStatus.published,
        AND: [
          {
            OR: [{ eventDate: null }, { eventDate: { gt: cutoff } }],
          },
          {
            OR: [
              { title: { contains: query } },
              { description: { contains: query } },
              { location: { contains: query } },
            ],
          },
        ],
      },
      include: postInclude,
      orderBy: { postedDate: 'desc' },
      take: limit,
    });

    return posts.map((post) => this.toPostResponse(post));
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<PostResponse> {
    const oldPost = await this.prisma.post.findUnique({
      where: { id },
      include: postInclude,
    });
    if (!oldPost) throw new NotFoundException('Post not found');

    const oldMainImage = oldPost.mainImage || '';
    const oldVideo = oldPost.video || '';
    const data: Prisma.PostUncheckedUpdateInput = {
      updatedAt: new Date(),
    };

    if (updatePostDto.title !== undefined) data.title = updatePostDto.title;
    if (updatePostDto.description !== undefined) {
      data.description = updatePostDto.description;
    }
    if (updatePostDto.profileName !== undefined) {
      data.profileName = updatePostDto.profileName;
    }
    if (updatePostDto.location !== undefined) {
      data.location = updatePostDto.location;
    }
    if (updatePostDto.link !== undefined) data.link = updatePostDto.link;
    if (updatePostDto.eventTime !== undefined) {
      data.eventTime = updatePostDto.eventTime;
    }

    const parsedIsLive = this.parseOptionalBoolean(updatePostDto.isLive);
    if (parsedIsLive !== undefined) data.isLive = parsedIsLive;

    const parsedIsPublished = this.parseOptionalBoolean(
      updatePostDto.isPublished,
    );
    if (parsedIsPublished !== undefined) {
      data.isPublished = parsedIsPublished;
      data.status = parsedIsPublished ? PostStatus.published : PostStatus.draft;
    }

    const parsedEventDate = this.parseOptionalDate(updatePostDto.eventDate);
    if (parsedEventDate !== undefined) {
      data.eventDate = parsedEventDate;
      const oldEventTime = oldPost.eventDate?.getTime();
      const newEventTime = parsedEventDate?.getTime();

      if (
        oldEventTime !== undefined &&
        newEventTime !== undefined &&
        oldEventTime !== newEventTime
      ) {
        data.isPublished = true;
        data.status = PostStatus.published;
      }

      const recalculatedExpiresAt =
        this.calculateExpiryFromEventDate(parsedEventDate);
      if (recalculatedExpiresAt) {
        data.expiresAt = recalculatedExpiresAt;
      }
    }

    if (updatePostDto.expiresAt !== undefined) {
      data.expiresAt = this.parseOptionalDate(updatePostDto.expiresAt);
    }

    const shouldRemoveImage = updatePostDto.removeImage === 'true';
    const shouldRemoveVideo = updatePostDto.removeVideo === 'true';
    const hasNewImage = !!updatePostDto.mainImage;
    const hasYoutubeUpdate = updatePostDto.youtubeUrl !== undefined;
    const youtubeMedia =
      hasYoutubeUpdate && updatePostDto.youtubeUrl?.trim()
        ? normalizeYoutubeUrl(updatePostDto.youtubeUrl)
        : null;

    if (updatePostDto.video) {
      throw new BadRequestException(
        'New uploaded videos are not supported. Use youtubeUrl instead.',
      );
    }

    if (hasNewImage) data.mainImage = updatePostDto.mainImage;
    if (shouldRemoveImage) data.mainImage = '';
    if (hasYoutubeUpdate) {
      data.video = null;
      data.videoSource = youtubeMedia ? PostVideoSource.YOUTUBE : null;
      data.youtubeUrl = youtubeMedia?.youtubeUrl ?? null;
      data.youtubeVideoId = youtubeMedia?.youtubeVideoId ?? null;
    }
    if (shouldRemoveVideo) {
      data.video = null;
      data.videoSource = null;
      data.youtubeUrl = null;
      data.youtubeVideoId = null;
    }

    const post = await this.prisma.post.update({
      where: { id },
      data,
      include: postInclude,
    });
    const postResponse = this.toPostResponse(post);

    try {
      if ((shouldRemoveImage || hasNewImage) && oldMainImage.trim() !== '') {
        const replacedWithDifferentImage =
          hasNewImage && oldMainImage !== post.mainImage;
        if (shouldRemoveImage || replacedWithDifferentImage) {
          this.deleteMediaFileIfExists(oldMainImage);
        }
      }

      if (shouldRemoveVideo && oldVideo.trim() !== '') {
        this.deleteMediaFileIfExists(oldVideo);
      }
    } catch (fileError) {
      console.error('Failed to delete replaced/removed media file:', fileError);
    }

    try {
      const authorName =
        post.author?.displayName || post.author?.username || 'Admin';
      const becamePublished =
        (!oldPost.isPublished && post.isPublished) ||
        (oldPost.status !== PostStatus.published &&
          post.status === PostStatus.published);

      if (becamePublished) {
        await this.notificationGateway.emitNewPost(postResponse, authorName);
      } else {
        await this.notificationGateway.emitPostUpdated(postResponse, authorName);
      }
    } catch (notifError: unknown) {
      console.error(
        'Notification emit failed:',
        notifError instanceof Error ? notifError.message : String(notifError),
      );
    }

    return postResponse;
  }

  async toggleLiveStatus(id: string): Promise<PostResponse> {
    const existingPost = await this.prisma.post.findUnique({
      where: { id },
      include: postInclude,
    });
    if (!existingPost) throw new NotFoundException('Post not found');

    const post = await this.prisma.post.update({
      where: { id },
      data: {
        isLive: !existingPost.isLive,
        updatedAt: new Date(),
      },
      include: postInclude,
    });
    const postResponse = this.toPostResponse(post);

    try {
      if (post.isLive) {
        const authorName =
          post.author?.displayName || post.author?.username || 'Admin';
        await this.notificationGateway.emitPostPublished(
          postResponse,
          authorName,
        );
      }
    } catch (notifError: unknown) {
      console.error(
        'Notification emit failed:',
        notifError instanceof Error ? notifError.message : String(notifError),
      );
    }

    return postResponse;
  }

  async republish(id: string): Promise<PostResponse> {
    const existingPost = await this.prisma.post.findUnique({ where: { id } });
    if (!existingPost) throw new NotFoundException('Post not found');

    const post = await this.prisma.post.update({
      where: { id },
      data: {
        status: PostStatus.published,
        isPublished: true,
        isLive: true,
        postedDate: new Date(),
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      include: postInclude,
    });

    return this.toPostResponse(post);
  }

  async delete(id: string): Promise<PostResponse> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: postInclude,
    });
    if (!post) throw new NotFoundException('Post not found');

    try {
      this.deleteMediaFileIfExists(post.mainImage);
      this.deleteMediaFileIfExists(post.video);
    } catch (error) {
      console.error('Error deleting media files:', error);
    }

    try {
      const authorName =
        post.author?.displayName || post.author?.username || 'Admin';
      await this.notificationGateway.emitPostDeleted(post.title, authorName);
    } catch (notifError: unknown) {
      console.error(
        'Notification emit failed:',
        notifError instanceof Error ? notifError.message : String(notifError),
      );
    }

    await this.prisma.post.delete({ where: { id } });
    return this.toPostResponse(post);
  }

  async canAdminEditPost(
    postId: string,
    adminId: string,
    adminRole: Role,
  ): Promise<boolean> {
    return adminRole === Role.SUPER_ADMIN || adminRole === Role.ADMIN;
  }

  async canAdminDeletePost(
    postId: string,
    adminId: string,
    adminRole: Role,
  ): Promise<boolean> {
    if (adminRole === Role.SUPER_ADMIN) return true;

    if (adminRole === Role.ADMIN) {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });
      if (!post) return false;
      return post.authorId === adminId;
    }

    return false;
  }

  async getStatistics(): Promise<PostStatistics> {
    const [total, live, groupedAuthors, recentPosts, postedDates] =
      await Promise.all([
        this.prisma.post.count(),
        this.prisma.post.count({ where: { isLive: true } }),
        this.prisma.post.groupBy({
          by: ['authorId'],
          _count: { _all: true },
        }),
        this.prisma.post.findMany({
          include: postInclude,
          orderBy: { postedDate: 'desc' },
          take: 5,
        }),
        this.prisma.post.findMany({
          select: { postedDate: true },
        }),
      ]);

    const topAuthors = groupedAuthors
      .map((author) => ({
        _id: author.authorId,
        count: author._count._all,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const monthCounts = new Map<string, number>();
    for (const post of postedDates) {
      const year = post.postedDate.getFullYear();
      const month = post.postedDate.getMonth() + 1;
      const key = `${year}-${month}`;
      monthCounts.set(key, (monthCounts.get(key) || 0) + 1);
    }

    const postsByMonth = Array.from(monthCounts.entries())
      .map(([key, count]) => {
        const [year, month] = key.split('-').map((value) => parseInt(value, 10));
        return { _id: { year, month }, count };
      })
      .sort((a, b) => {
        if (a._id.year !== b._id.year) return b._id.year - a._id.year;
        return b._id.month - a._id.month;
      })
      .slice(0, 6);

    return {
      total,
      live,
      draft: total - live,
      topAuthors,
      recentPosts: recentPosts.map((post) => this.toPostResponse(post)),
      postsByMonth,
    };
  }

  async bulkUpdateIsLive(ids: string[], isLive: boolean): Promise<number> {
    const result = await this.prisma.post.updateMany({
      where: { id: { in: ids } },
      data: { isLive, updatedAt: new Date() },
    });
    return result.count;
  }

  async deleteByAuthor(authorId: string): Promise<number> {
    const posts = await this.prisma.post.findMany({
      where: { authorId },
      select: { id: true, mainImage: true, video: true },
    });

    posts.forEach((post) => {
      try {
        this.deleteMediaFileIfExists(post.mainImage);
        this.deleteMediaFileIfExists(post.video);
      } catch (error) {
        console.error(`Error deleting media for post ${post.id}:`, error);
      }
    });

    const result = await this.prisma.post.deleteMany({
      where: { authorId },
    });

    return result.count;
  }
}

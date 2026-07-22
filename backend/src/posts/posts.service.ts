import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Admin as PrismaAdmin,
  AdminRole,
  Post as PrismaPost,
  PostLiveStatus,
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
import { FirebaseService } from '../firebase/firebase.service';
import { NotificationGateway } from '../notifications/notification.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { normalizeFacebookUrl } from './facebook-url.util';
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

const DEFAULT_POST_EXPIRY_DAYS = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

type PostWithAuthor = Prisma.PostGetPayload<{ include: typeof postInclude }>;

interface NotificationActor {
  id?: string;
  name: string;
}

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

interface PostDeletePermissionResult {
  allowed: boolean;
  message?: string;
}

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
    private readonly firebaseService: FirebaseService,
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
      videoSource: post.videoSource,
      youtubeUrl: post.youtubeUrl,
      youtubeVideoId: post.youtubeVideoId,
      facebookUrl: post.facebookUrl,
      profileName: post.profileName,
      eventDate: post.eventDate,
      eventTime: post.eventTime,
      location: post.location,
      isLive: post.isLive,
      liveStatus: post.liveStatus,
      liveStatusCheckedAt: post.liveStatusCheckedAt,
      isPublished: post.isPublished,
      status: post.status,
      postedDate: post.postedDate,
      link: post.link,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      expiresAt: post.expiresAt,
      reminderEnabled: post.reminderEnabled,
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

  private calculateExpiryFromDays(
    postedDate: Date,
    expireAfterDays?: number | null,
  ): Date {
    const days =
      Number.isInteger(expireAfterDays) && Number(expireAfterDays) > 0
        ? Number(expireAfterDays)
        : DEFAULT_POST_EXPIRY_DAYS;

    return new Date(postedDate.getTime() + days * DAY_MS);
  }

  private resolveCreateExpiresAt(
    createPostDto: CreatePostDto,
    postedDate: Date,
  ): Date | null {
    const autoExpire = this.parseOptionalBoolean(createPostDto.autoExpire);

    if (autoExpire === false) return null;
    if (autoExpire === true || createPostDto.expireAfterDays !== undefined) {
      return this.calculateExpiryFromDays(
        postedDate,
        createPostDto.expireAfterDays,
      );
    }

    const explicitExpiresAt = this.parseOptionalDate(createPostDto.expiresAt);
    if (explicitExpiresAt !== undefined) return explicitExpiresAt;

    return this.calculateExpiryFromDays(postedDate, DEFAULT_POST_EXPIRY_DAYS);
  }

  private resolveUpdateExpiresAt(
    updatePostDto: UpdatePostDto,
    postedDate: Date,
  ): Date | null | undefined {
    const autoExpire = this.parseOptionalBoolean(updatePostDto.autoExpire);

    if (autoExpire === false) return null;
    if (autoExpire === true || updatePostDto.expireAfterDays !== undefined) {
      return this.calculateExpiryFromDays(
        postedDate,
        updatePostDto.expireAfterDays,
      );
    }

    if (updatePostDto.expiresAt !== undefined) {
      return this.parseOptionalDate(updatePostDto.expiresAt);
    }

    return undefined;
  }

  private buildVisibleExpiryWhere(now: Date = new Date()): Prisma.PostWhereInput {
    return {
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    };
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

  private getTrimmedValue(value?: string | null): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private hasVideoMedia(
    post: Pick<
      PrismaPost,
      'videoSource' | 'youtubeUrl' | 'youtubeVideoId' | 'facebookUrl'
    >,
  ): boolean {
    return Boolean(
      post.videoSource ||
        post.youtubeUrl ||
        post.youtubeVideoId ||
        post.facebookUrl,
    );
  }

  private getManualLiveStatus(
    isLive: boolean,
    post: Pick<
      PrismaPost,
      'videoSource' | 'youtubeUrl' | 'youtubeVideoId' | 'facebookUrl'
    >,
  ): PostLiveStatus {
    if (isLive) return PostLiveStatus.LIVE;
    return this.hasVideoMedia(post)
      ? PostLiveStatus.WAS_LIVE
      : PostLiveStatus.NOT_LIVE;
  }

  private parseFacebookVideoId(value?: string | null): string | null {
    const input = this.getTrimmedValue(value);
    if (!input) return null;

    try {
      const parsed = new URL(input);
      const watchId = parsed.searchParams.get('v');
      if (watchId) return watchId;

      const segments = parsed.pathname.split('/').filter(Boolean);
      const videoSegmentIndex = segments.findIndex((segment) =>
        ['videos', 'live_videos', 'watch'].includes(segment),
      );
      if (videoSegmentIndex >= 0 && segments[videoSegmentIndex + 1]) {
        return segments[videoSegmentIndex + 1];
      }

      const numericSegment = [...segments]
        .reverse()
        .find((segment) => /^\d+$/.test(segment));
      return numericSegment ?? null;
    } catch {
      return null;
    }
  }

  private async fetchYoutubeLiveStatus(
    videoId?: string | null,
  ): Promise<PostLiveStatus | null> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey || !videoId) return null;

    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/videos');
      url.searchParams.set('part', 'snippet,liveStreamingDetails');
      url.searchParams.set('id', videoId);
      url.searchParams.set('key', apiKey);

      const response = await fetch(url);
      if (!response.ok) return null;

      const payload = (await response.json()) as {
        items?: Array<{
          snippet?: { liveBroadcastContent?: string };
          liveStreamingDetails?: {
            actualStartTime?: string;
            actualEndTime?: string;
            scheduledStartTime?: string;
          };
        }>;
      };
      const item = payload.items?.[0];
      if (!item) return PostLiveStatus.NOT_LIVE;

      const liveContent = item.snippet?.liveBroadcastContent;
      const liveDetails = item.liveStreamingDetails;

      if (liveDetails?.actualEndTime) return PostLiveStatus.WAS_LIVE;
      if (liveContent === 'live' || liveDetails?.actualStartTime) {
        return PostLiveStatus.LIVE;
      }
      if (liveContent === 'upcoming' || liveDetails?.scheduledStartTime) {
        return PostLiveStatus.UPCOMING;
      }

      return PostLiveStatus.NOT_LIVE;
    } catch (error) {
      console.error('Failed to fetch YouTube live status:', error);
      return null;
    }
  }

  private async fetchFacebookLiveStatus(
    facebookUrl?: string | null,
  ): Promise<PostLiveStatus | null> {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    const videoId = this.parseFacebookVideoId(facebookUrl);
    if (!accessToken || !videoId) return null;

    try {
      const url = new URL(`https://graph.facebook.com/v21.0/${videoId}`);
      url.searchParams.set('fields', 'live_status,status');
      url.searchParams.set('access_token', accessToken);

      const response = await fetch(url);
      if (!response.ok) return null;

      const payload = (await response.json()) as {
        live_status?: string;
        status?: string;
      };
      const status = (payload.live_status || payload.status || '').toUpperCase();

      if (['LIVE', 'LIVE_NOW'].includes(status)) return PostLiveStatus.LIVE;
      if (['SCHEDULED', 'SCHEDULED_UNPUBLISHED'].includes(status)) {
        return PostLiveStatus.UPCOMING;
      }
      if (['VOD', 'LIVE_STOPPED', 'UNPUBLISHED', 'FINISHED'].includes(status)) {
        return PostLiveStatus.WAS_LIVE;
      }

      return null;
    } catch (error) {
      console.error('Failed to fetch Facebook live status:', error);
      return null;
    }
  }

  private async fetchProviderLiveStatus(
    post: Pick<
      PrismaPost,
      'videoSource' | 'youtubeVideoId' | 'youtubeUrl' | 'facebookUrl'
    >,
  ): Promise<PostLiveStatus | null> {
    if (post.videoSource === PostVideoSource.YOUTUBE) {
      return this.fetchYoutubeLiveStatus(post.youtubeVideoId);
    }

    if (post.videoSource === PostVideoSource.FACEBOOK) {
      return this.fetchFacebookLiveStatus(post.facebookUrl);
    }

    return null;
  }

  private liveStatusToIsLive(liveStatus: PostLiveStatus): boolean {
    return liveStatus === PostLiveStatus.LIVE;
  }

  private async resolveProviderLiveStatusForVisiblePost(
    post: Pick<
      PrismaPost,
      | 'videoSource'
      | 'youtubeVideoId'
      | 'youtubeUrl'
      | 'facebookUrl'
      | 'isPublished'
      | 'status'
    >,
  ): Promise<PostLiveStatus | null> {
    if (!post.isPublished || post.status !== PostStatus.published) return null;
    return this.fetchProviderLiveStatus(post);
  }

  private getLiveNotificationMessage(postTitle: string): string {
    return postTitle
      ? `Tap to watch "${postTitle}".`
      : 'Tap to watch the live stream.';
  }

  private async sendPostStartedLiveNotification(
    post: Pick<
      PrismaPost,
      'id' | 'title' | 'isPublished' | 'status' | 'videoSource'
    >,
  ): Promise<void> {
    if (!post.isPublished || post.status !== PostStatus.published) return;

    const title = 'Radio Yeraz is live';
    const message = this.getLiveNotificationMessage(post.title);

    try {
      await this.firebaseService.sendToTopic('client', title, message, {
        type: 'POST_LIVE',
        postId: post.id,
        postTitle: post.title,
        title,
        message,
        liveStatus: String(PostLiveStatus.LIVE),
        videoSource: post.videoSource ? String(post.videoSource) : '',
        notificationId: `post-live-${post.id}-${Date.now()}`,
      });
    } catch (notifError: unknown) {
      console.error(
        'FCM live notification failed:',
        notifError instanceof Error ? notifError.message : String(notifError),
      );
    }
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

  async expirePostsPastExpiryDate(): Promise<number> {
    const now = new Date();

    const result = await this.prisma.post.updateMany({
      where: {
        expiresAt: { lte: now },
        isPublished: true,
        status: { not: PostStatus.expired },
      },
      data: {
        isPublished: false,
        isLive: false,
        liveStatus: PostLiveStatus.NOT_LIVE,
        liveStatusCheckedAt: now,
        status: PostStatus.expired,
        updatedAt: now,
      },
    });

    return result.count;
  }

  async syncMediaLiveStatuses(): Promise<number> {
    const posts = await this.prisma.post.findMany({
      where: {
        videoSource: { not: null },
        status: { not: PostStatus.expired },
        OR: [
          { isLive: true },
          {
            liveStatus: {
              in: [
                PostLiveStatus.UNKNOWN,
                PostLiveStatus.UPCOMING,
                PostLiveStatus.LIVE,
              ],
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        videoSource: true,
        youtubeUrl: true,
        youtubeVideoId: true,
        facebookUrl: true,
        isLive: true,
        liveStatus: true,
        isPublished: true,
        status: true,
      },
    });

    let updatedCount = 0;

    for (const post of posts) {
      const liveStatus = await this.fetchProviderLiveStatus(post);
      const nextIsLive = liveStatus
        ? this.liveStatusToIsLive(liveStatus)
        : false;
      if (
        !liveStatus ||
        (liveStatus === post.liveStatus && nextIsLive === post.isLive)
      ) {
        continue;
      }

      const checkedAt = new Date();

      const updatedPost = await this.prisma.post.update({
        where: { id: post.id },
        data: {
          liveStatus,
          liveStatusCheckedAt: checkedAt,
          isLive: nextIsLive,
          updatedAt: checkedAt,
        },
        select: {
          id: true,
          title: true,
          isPublished: true,
          status: true,
          videoSource: true,
        },
      });

      updatedCount += 1;

      if (liveStatus === PostLiveStatus.LIVE && !post.isLive) {
        await this.sendPostStartedLiveNotification(updatedPost);
      }
    }

    return updatedCount;
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
    const reminderEnabledValue =
      this.parseOptionalBoolean(createPostDto.reminderEnabled) ?? false;
    const postedDate = new Date();
    const expiresAt = this.resolveCreateExpiresAt(createPostDto, postedDate);
    const youtubeInput = this.getTrimmedValue(createPostDto.youtubeUrl);
    const facebookInput = this.getTrimmedValue(createPostDto.facebookUrl);

    if (reminderEnabledValue && !eventDate) {
      throw new BadRequestException('Reminder requires an event date');
    }

    if (youtubeInput && facebookInput) {
      throw new BadRequestException(
        'Choose either a YouTube URL or a Facebook URL, not both',
      );
    }

    if (createPostDto.mainImage && (youtubeInput || facebookInput)) {
      throw new BadRequestException(
        'Choose either an image or a video URL, not both',
      );
    }

    const youtubeMedia = youtubeInput
      ? normalizeYoutubeUrl(youtubeInput)
      : null;
    const facebookMedia = facebookInput
      ? normalizeFacebookUrl(facebookInput)
      : null;
    const hasVideoMedia = Boolean(youtubeMedia || facebookMedia);
    const videoSource = youtubeMedia
      ? PostVideoSource.YOUTUBE
      : facebookMedia
        ? PostVideoSource.FACEBOOK
        : null;
    const detectedLiveStatus = isLiveValue
      ? null
      : await this.resolveProviderLiveStatusForVisiblePost({
          videoSource,
          youtubeUrl: youtubeMedia?.youtubeUrl ?? null,
          youtubeVideoId: youtubeMedia?.youtubeVideoId ?? null,
          facebookUrl: facebookMedia?.facebookUrl ?? null,
          isPublished: isPublishedValue,
          status: isPublishedValue ? PostStatus.published : PostStatus.draft,
        });
    const initialLiveStatus = isLiveValue
      ? PostLiveStatus.LIVE
      : detectedLiveStatus ??
        (hasVideoMedia ? PostLiveStatus.UNKNOWN : PostLiveStatus.NOT_LIVE);
    const initialIsLive =
      isLiveValue || initialLiveStatus === PostLiveStatus.LIVE;
    const initialLiveStatusCheckedAt =
      isLiveValue || detectedLiveStatus ? new Date() : null;

    const savedPost = await this.prisma.post.create({
      data: {
        id: createObjectIdString(),
        title: createPostDto.title,
        description: createPostDto.description,
        mainImage: youtubeMedia || facebookMedia ? '' : createPostDto.mainImage || '',
        videoSource,
        youtubeUrl: youtubeMedia?.youtubeUrl ?? null,
        youtubeVideoId: youtubeMedia?.youtubeVideoId ?? null,
        facebookUrl: facebookMedia?.facebookUrl ?? null,
        profileName: createPostDto.profileName || 'Radio Yeraz',
        eventDate,
        eventTime: createPostDto.eventTime,
        location: createPostDto.location,
        isLive: initialIsLive,
        liveStatus: initialLiveStatus,
        liveStatusCheckedAt: initialLiveStatusCheckedAt,
        isPublished: isPublishedValue,
        status: isPublishedValue ? PostStatus.published : PostStatus.draft,
        postedDate,
        authorId,
        link: createPostDto.link,
        expiresAt,
        reminderEnabled: reminderEnabledValue,
      },
      include: postInclude,
    });

    const postResponse = this.toPostResponse(savedPost);

    try {
      const authorName = author.displayName || author.username || 'Admin';

      if (savedPost.isPublished) {
        await this.notificationGateway.emitNewPost(
          postResponse,
          authorName,
          authorId,
        );
      } else {
        await this.notificationGateway.emitNewDraft(
          postResponse,
          authorName,
          authorId,
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
    await this.expirePostsPastExpiryDate();

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
    await this.expirePostsPastExpiryDate();

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
    await this.expirePostsPastExpiryDate();

    const posts = await this.prisma.post.findMany({
      where: { authorId },
      include: postInclude,
      orderBy: { postedDate: 'desc' },
    });

    return posts.map((post) => this.toPostResponse(post));
  }

  async findLivePosts(): Promise<PostResponse[]> {
    await this.expirePostsPastExpiryDate();

    const posts = await this.prisma.post.findMany({
      where: {
        isLive: true,
        isPublished: true,
        status: PostStatus.published,
        ...this.buildVisibleExpiryWhere(),
      },
      include: postInclude,
      orderBy: { postedDate: 'desc' },
    });

    return posts.map((post) => this.toPostResponse(post));
  }

  async findRecentPosts(limit: number = 5): Promise<PostResponse[]> {
    await this.expirePostsPastExpiryDate();

    const posts = await this.prisma.post.findMany({
      where: {
        isPublished: true,
        status: PostStatus.published,
        ...this.buildVisibleExpiryWhere(),
      },
      include: postInclude,
      orderBy: { postedDate: 'desc' },
      take: limit,
    });

    return posts.map((post) => this.toPostResponse(post));
  }

  async searchPosts(query: string, limit: number = 20): Promise<PostResponse[]> {
    await this.expirePostsPastExpiryDate();

    const posts = await this.prisma.post.findMany({
      where: {
        isPublished: true,
        status: PostStatus.published,
        AND: [
          this.buildVisibleExpiryWhere(),
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

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    actor?: NotificationActor,
  ): Promise<PostResponse> {
    const oldPost = await this.prisma.post.findUnique({
      where: { id },
      include: postInclude,
    });
    if (!oldPost) throw new NotFoundException('Post not found');

    const oldMainImage = oldPost.mainImage || '';
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
    if (parsedIsLive !== undefined) {
      data.isLive = parsedIsLive;
      data.liveStatus = this.getManualLiveStatus(parsedIsLive, oldPost);
      data.liveStatusCheckedAt = new Date();
    }

    const parsedIsPublished = this.parseOptionalBoolean(
      updatePostDto.isPublished,
    );
    if (parsedIsPublished !== undefined) {
      data.isPublished = parsedIsPublished;
      data.status = parsedIsPublished ? PostStatus.published : PostStatus.draft;
    }

    const parsedEventDate = this.parseOptionalDate(updatePostDto.eventDate);
    const parsedReminderEnabled = this.parseOptionalBoolean(
      updatePostDto.reminderEnabled,
    );
    const nextEventDate =
      parsedEventDate !== undefined ? parsedEventDate : oldPost.eventDate;
    let nextReminderEnabled =
      parsedReminderEnabled !== undefined
        ? parsedReminderEnabled
        : oldPost.reminderEnabled;

    if (nextReminderEnabled && !nextEventDate) {
      if (parsedReminderEnabled === true) {
        throw new BadRequestException('Reminder requires an event date');
      }

      nextReminderEnabled = false;
      data.reminderEnabled = false;
    } else if (parsedReminderEnabled !== undefined) {
      data.reminderEnabled = parsedReminderEnabled;
    }

    if (parsedEventDate !== undefined) {
      data.eventDate = parsedEventDate;
      const oldEventTime = oldPost.eventDate?.getTime();
      const newEventTime = parsedEventDate?.getTime();
      const eventDateChanged =
        (oldEventTime ?? null) !== (newEventTime ?? null);

      if (
        oldEventTime !== undefined &&
        newEventTime !== undefined &&
        oldEventTime !== newEventTime
      ) {
        data.isPublished = true;
        data.status = PostStatus.published;
      }

      if (eventDateChanged) {
        data.reminderSentAt = null;
      }
    }

    if (parsedReminderEnabled === true && !oldPost.reminderEnabled) {
      data.reminderSentAt = null;
    }

    const updatedExpiresAt = this.resolveUpdateExpiresAt(
      updatePostDto,
      oldPost.postedDate,
    );
    if (updatedExpiresAt !== undefined) {
      data.expiresAt = updatedExpiresAt;
    }

    const shouldRemoveImage = updatePostDto.removeImage === 'true';
    const hasNewImage = !!updatePostDto.mainImage;
    const hasYoutubeUpdate = updatePostDto.youtubeUrl !== undefined;
    const hasFacebookUpdate = updatePostDto.facebookUrl !== undefined;
    const youtubeInput = this.getTrimmedValue(updatePostDto.youtubeUrl);
    const facebookInput = this.getTrimmedValue(updatePostDto.facebookUrl);
    const requestedIsLive = parsedIsLive ?? oldPost.isLive;

    if (youtubeInput && facebookInput) {
      throw new BadRequestException(
        'Choose either a YouTube URL or a Facebook URL, not both',
      );
    }

    if (hasNewImage && (youtubeInput || facebookInput)) {
      throw new BadRequestException(
        'Choose either an image or a video URL, not both',
      );
    }

    const youtubeMedia = youtubeInput ? normalizeYoutubeUrl(youtubeInput) : null;
    const facebookMedia = facebookInput
      ? normalizeFacebookUrl(facebookInput)
      : null;

    if (hasNewImage) {
      data.mainImage = updatePostDto.mainImage;
      data.videoSource = null;
      data.youtubeUrl = null;
      data.youtubeVideoId = null;
      data.facebookUrl = null;
      data.liveStatus = requestedIsLive
        ? PostLiveStatus.LIVE
        : PostLiveStatus.NOT_LIVE;
      data.liveStatusCheckedAt = new Date();
    }
    if (shouldRemoveImage) data.mainImage = '';

    if (youtubeMedia) {
      data.mainImage = '';
      data.videoSource = PostVideoSource.YOUTUBE;
      data.youtubeUrl = youtubeMedia?.youtubeUrl ?? null;
      data.youtubeVideoId = youtubeMedia?.youtubeVideoId ?? null;
      data.facebookUrl = null;
      data.liveStatus = requestedIsLive
        ? PostLiveStatus.LIVE
        : PostLiveStatus.UNKNOWN;
      data.liveStatusCheckedAt = requestedIsLive ? new Date() : null;
    } else if (facebookMedia) {
      data.mainImage = '';
      data.videoSource = PostVideoSource.FACEBOOK;
      data.youtubeUrl = null;
      data.youtubeVideoId = null;
      data.facebookUrl = facebookMedia.facebookUrl;
      data.liveStatus = requestedIsLive
        ? PostLiveStatus.LIVE
        : PostLiveStatus.UNKNOWN;
      data.liveStatusCheckedAt = requestedIsLive ? new Date() : null;
    } else if (
      (hasYoutubeUpdate &&
        !youtubeInput &&
        oldPost.videoSource === PostVideoSource.YOUTUBE) ||
      (hasFacebookUpdate &&
        !facebookInput &&
        oldPost.videoSource === PostVideoSource.FACEBOOK) ||
      (hasYoutubeUpdate && hasFacebookUpdate && !youtubeInput && !facebookInput)
    ) {
      data.videoSource = null;
      data.youtubeUrl = null;
      data.youtubeVideoId = null;
      data.facebookUrl = null;
      data.liveStatus = PostLiveStatus.NOT_LIVE;
      data.liveStatusCheckedAt = new Date();
    }

    let post = await this.prisma.post.update({
      where: { id },
      data,
      include: postInclude,
    });
    const wasClientVisible =
      oldPost.isPublished && oldPost.status === PostStatus.published;
    const shouldCheckProviderImmediately =
      !post.isLive &&
      (hasYoutubeUpdate ||
        hasFacebookUpdate ||
        parsedIsPublished === true ||
        post.liveStatus === PostLiveStatus.UNKNOWN ||
        post.liveStatus === PostLiveStatus.UPCOMING);

    if (shouldCheckProviderImmediately) {
      const detectedLiveStatus =
        await this.resolveProviderLiveStatusForVisiblePost(post);
      const detectedIsLive = detectedLiveStatus
        ? this.liveStatusToIsLive(detectedLiveStatus)
        : false;

      if (
        detectedLiveStatus &&
        (detectedLiveStatus !== post.liveStatus || detectedIsLive !== post.isLive)
      ) {
        post = await this.prisma.post.update({
          where: { id },
          data: {
            liveStatus: detectedLiveStatus,
            liveStatusCheckedAt: new Date(),
            isLive: detectedIsLive,
            updatedAt: new Date(),
          },
          include: postInclude,
        });
      }
    }

    const postResponse = this.toPostResponse(post);
    const isClientVisible =
      post.isPublished && post.status === PostStatus.published;

    try {
      if ((shouldRemoveImage || hasNewImage) && oldMainImage.trim() !== '') {
        const replacedWithDifferentImage =
          hasNewImage && oldMainImage !== post.mainImage;
        if (shouldRemoveImage || replacedWithDifferentImage) {
          this.deleteMediaFileIfExists(oldMainImage);
        }
      }
    } catch (fileError) {
      console.error('Failed to delete replaced/removed media file:', fileError);
    }

    try {
      if (
        post.isLive &&
        (!oldPost.isLive || !wasClientVisible) &&
        isClientVisible
      ) {
        await this.sendPostStartedLiveNotification(post);
      }

      const actorName =
        actor?.name ||
        post.author?.displayName || post.author?.username || 'Admin';
      const becamePublished =
        (!oldPost.isPublished && post.isPublished) ||
        (oldPost.status !== PostStatus.published &&
          post.status === PostStatus.published);

      if (becamePublished) {
        await this.notificationGateway.emitNewPost(
          postResponse,
          actorName,
          actor?.id,
        );
      } else {
        await this.notificationGateway.emitPostUpdated(
          postResponse,
          actorName,
          actor?.id,
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

  async toggleLiveStatus(
    id: string,
    actor?: NotificationActor,
  ): Promise<PostResponse> {
    const existingPost = await this.prisma.post.findUnique({
      where: { id },
      include: postInclude,
    });
    if (!existingPost) throw new NotFoundException('Post not found');

    const nextIsLive = !existingPost.isLive;
    const post = await this.prisma.post.update({
      where: { id },
      data: {
        isLive: nextIsLive,
        liveStatus: this.getManualLiveStatus(nextIsLive, existingPost),
        liveStatusCheckedAt: new Date(),
        updatedAt: new Date(),
      },
      include: postInclude,
    });
    const postResponse = this.toPostResponse(post);

    try {
      if (!existingPost.isLive && post.isLive) {
        await this.sendPostStartedLiveNotification(post);
      }

      if (post.isLive) {
        const actorName =
          actor?.name ||
          post.author?.displayName || post.author?.username || 'Admin';
        await this.notificationGateway.emitPostPublished(
          postResponse,
          actorName,
          actor?.id,
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

    const postedDate = new Date();
    const post = await this.prisma.post.update({
      where: { id },
      data: {
        status: PostStatus.published,
        isPublished: true,
        isLive: true,
        liveStatus: PostLiveStatus.LIVE,
        liveStatusCheckedAt: new Date(),
        postedDate,
        expiresAt: this.calculateExpiryFromDays(
          postedDate,
          DEFAULT_POST_EXPIRY_DAYS,
        ),
        updatedAt: new Date(),
      },
      include: postInclude,
    });

    if (!existingPost.isLive && post.isLive) {
      await this.sendPostStartedLiveNotification(post);
    }

    return this.toPostResponse(post);
  }

  async delete(id: string, actor?: NotificationActor): Promise<PostResponse> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: postInclude,
    });
    if (!post) throw new NotFoundException('Post not found');

    try {
      this.deleteMediaFileIfExists(post.mainImage);
    } catch (error) {
      console.error('Error deleting media files:', error);
    }

    try {
      const actorName =
        actor?.name ||
        post.author?.displayName || post.author?.username || 'Admin';
      await this.notificationGateway.emitPostDeleted(
        post.title,
        actorName,
        actor?.id,
      );
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
  ): Promise<PostDeletePermissionResult> {
    if (adminRole === Role.SUPER_ADMIN) return { allowed: true };

    if (adminRole === Role.ADMIN) {
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: {
          authorId: true,
          author: { select: { role: true } },
        },
      });
      if (!post) {
        return {
          allowed: false,
          message: 'Post not found',
        };
      }

      if (post.authorId === adminId) return { allowed: true };

      if (post.author?.role === AdminRole.SUPER_ADMIN) {
        return {
          allowed: false,
          message:
            "This post was created by a super admin. You don't have permission to delete super admin-created posts.",
        };
      }

      return {
        allowed: false,
        message: "You don't have permission to delete posts created by another admin.",
      };
    }

    return {
      allowed: false,
      message: 'You are not authorized to delete this post',
    };
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
      data: {
        isLive,
        liveStatus: isLive ? PostLiveStatus.LIVE : PostLiveStatus.WAS_LIVE,
        liveStatusCheckedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return result.count;
  }

  async deleteByAuthor(authorId: string): Promise<number> {
    const posts = await this.prisma.post.findMany({
      where: { authorId },
      select: { id: true, mainImage: true },
    });

    posts.forEach((post) => {
      try {
        this.deleteMediaFileIfExists(post.mainImage);
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

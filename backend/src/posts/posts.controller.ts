// src/posts/posts.controller.ts
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
  BadRequestException,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { PostStatus } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import { Role } from '../admin/schemas/admin.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { FirebaseService } from '../firebase/firebase.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import {
  PostFindAllFilters,
  PostSortField,
  PostSortOptions,
  PostsService,
} from './posts.service';

interface PostUploadFiles {
  mainImage?: Express.Multer.File[];
}

type CreatePostPayload = CreatePostDto & {
  author: string;
  isLive: boolean;
  isPublished: boolean;
  mainImage: string;
};

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly firebaseService: FirebaseService,
  ) {}

  private parseBooleanQuery(value: string | undefined): boolean | undefined {
    if (value === undefined) return undefined;
    return value === 'true';
  }

  private parseSortField(field: string): PostSortField {
    switch (field) {
      case 'createdAt':
        return 'createdAt';
      case 'updatedAt':
        return 'updatedAt';
      case 'eventDate':
        return 'eventDate';
      case 'title':
        return 'title';
      case 'status':
        return 'status';
      case 'postedDate':
      default:
        return 'postedDate';
    }
  }

  private parseBodyBoolean(value: unknown): boolean {
    return value === true || value === 'true';
  }

  @Get()
  async getAllPosts(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('isPublished') isPublished: string,
    @Query('author') authorId: string,
    @Query('isLive') isLive: string,
    @Query('search') search: string,
    @Query('sortBy') sortBy: string = 'postedDate',
    @Query('sortOrder') sortOrder: string = 'desc',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    const filters: PostFindAllFilters = {};
    if (authorId) filters.author = authorId;

    const liveFilter = this.parseBooleanQuery(isLive);
    if (liveFilter !== undefined) filters.isLive = liveFilter;

    const publishedFilter = this.parseBooleanQuery(isPublished);
    if (publishedFilter !== undefined) {
      filters.isPublished = publishedFilter;
    }

    const sort: PostSortOptions = {
      field: this.parseSortField(sortBy),
      direction: sortOrder === 'asc' ? 'asc' : 'desc',
    };

    const result = await this.postsService.findAll(
      pageNum,
      limitNum,
      filters,
      sort,
      search,
    );

    return {
      success: true,
      ...result,
    };
  }

  @Get('live')
  async getLivePosts() {
    const posts = await this.postsService.findLivePosts();

    return {
      success: true,
      data: posts,
    };
  }

  @Get('recent')
  async getRecentPosts(@Query('limit') limit: string = '5') {
    const limitNum = parseInt(limit, 10) || 5;
    const posts = await this.postsService.findRecentPosts(limitNum);

    return {
      success: true,
      data: posts,
    };
  }

  @Get('search')
  async searchPosts(
    @Query('q') query: string,
    @Query('limit') limit: string = '20',
  ) {
    if (!query || query.trim().length < 2) {
      return {
        success: false,
        message: 'Search query must be at least 2 characters',
      };
    }

    const limitNum = parseInt(limit, 10) || 20;
    const posts = await this.postsService.searchPosts(query, limitNum);

    return {
      success: true,
      data: posts,
    };
  }

  @Get(':id')
  async getPostById(@Param('id') id: string) {
    const post = await this.postsService.findById(id);

    return {
      success: true,
      data: post,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'mainImage', maxCount: 1 }],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const uploadPath = './uploads/posts/images';

            if (!fs.existsSync(uploadPath)) {
              fs.mkdirSync(uploadPath, { recursive: true });
            }

            cb(null, uploadPath);
          },
          filename: (req, file, callback) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
            callback(null, filename);
          },
        }),
      },
    ),
  )
  async createPost(
    @Req() req: AuthenticatedRequest,
    @UploadedFiles() files: PostUploadFiles,
    @Body() createPostDto: CreatePostDto,
  ) {
    const authorId = req.user.sub;
    const postData: CreatePostPayload = {
      ...createPostDto,
      author: authorId,
      isLive: this.parseBodyBoolean(createPostDto.isLive),
      isPublished: this.parseBodyBoolean(createPostDto.isPublished),
      mainImage: '',
    };

    if (files?.mainImage?.[0]) {
      postData.mainImage = `/uploads/posts/images/${files.mainImage[0].filename}`;
    }

    const post = await this.postsService.create(postData, authorId);

    if (post.isPublished) {
      try {
        await this.firebaseService.sendToTopic(
          'client',
          'A New Post Added',
          post.title,
          {
            postId: post._id,
          },
        );
      } catch (notifError) {
        console.error(
          'FCM topic notification failed:',
          notifError instanceof Error ? notifError.message : String(notifError),
        );
      }
    }

    return {
      success: true,
      message: 'Post created successfully',
      data: post,
    };
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [{ name: 'mainImage', maxCount: 1 }],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            const uploadPath = './uploads/posts/images';
            if (!fs.existsSync(uploadPath)) {
              fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
          },
          filename: (req, file, callback) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);
            const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
            callback(null, filename);
          },
        }),
      },
    ),
  )
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFiles() files?: PostUploadFiles,
  ) {
    const previousPost = await this.postsService.findById(id);

    if (!updatePostDto) {
      throw new BadRequestException('No data provided');
    }

    if (files?.mainImage?.[0]) {
      updatePostDto.mainImage = `/uploads/posts/images/${files.mainImage[0].filename}`;
    }
    const updatedPost = await this.postsService.update(id, updatePostDto);

    const becamePublished =
      (!previousPost.isPublished && updatedPost.isPublished) ||
      (previousPost.status !== PostStatus.published &&
        updatedPost.status === PostStatus.published);

    if (becamePublished) {
      try {
        await this.firebaseService.sendToTopic(
          'client',
          'A New Post Added',
          updatedPost.title,
          {
            postId: updatedPost._id,
          },
        );
      } catch (notifError) {
        console.error(
          'FCM topic notification failed on publish transition:',
          notifError instanceof Error ? notifError.message : String(notifError),
        );
      }
    }

    return {
      success: true,
      message: 'Post updated successfully',
      data: updatedPost,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async deletePost(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const canDelete = await this.postsService.canAdminDeletePost(
      id,
      req.user.sub,
      req.user.role,
    );
    if (!canDelete) {
      return {
        success: false,
        message: 'You are not authorized to delete this post',
      };
    }

    await this.postsService.delete(id);

    return {
      success: true,
      message: 'Post deleted successfully',
    };
  }

  @Put(':id/toggle-live')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async toggleLiveStatus(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const canEdit = await this.postsService.canAdminEditPost(
      id,
      req.user.sub,
      req.user.role,
    );
    if (!canEdit) {
      return {
        success: false,
        message: 'You are not authorized to modify this post',
      };
    }

    const post = await this.postsService.toggleLiveStatus(id);

    return {
      success: true,
      message: `Post ${post.isLive ? 'published' : 'unpublished'} successfully`,
      data: post,
    };
  }

  @Put(':id/republish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async republishPost(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const canEdit = await this.postsService.canAdminEditPost(
      id,
      req.user.sub,
      req.user.role,
    );

    if (!canEdit) {
      return {
        success: false,
        message: 'You are not authorized to modify this post',
      };
    }

    const post = await this.postsService.republish(id);

    return {
      success: true,
      message: 'Post republished successfully',
      data: post,
    };
  }

  @Get('author/my-posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async getMyPosts(@Req() req: AuthenticatedRequest) {
    const posts = await this.postsService.findByAuthor(req.user.sub);

    return {
      success: true,
      data: posts,
    };
  }

  @Get('author/:authorId')
  async getPostsByAuthor(@Param('authorId') authorId: string) {
    const posts = await this.postsService.findByAuthor(authorId);

    return {
      success: true,
      data: posts,
    };
  }

  @Get('statistics/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async getPostStatistics() {
    const statistics = await this.postsService.getStatistics();

    return {
      success: true,
      data: statistics,
    };
  }

  @Put('bulk/toggle-live')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async bulkToggleLive(@Body() body: { ids: string[]; isLive: boolean }) {
    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return {
        success: false,
        message: 'No post IDs provided',
      };
    }

    const updatedCount = await this.postsService.bulkUpdateIsLive(
      body.ids,
      body.isLive,
    );

    return {
      success: true,
      message: `Updated ${updatedCount} posts`,
    };
  }
}

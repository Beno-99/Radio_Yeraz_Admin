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
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException,
  UploadedFiles,
} from '@nestjs/common';
import {
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../admin/schemas/admin.schema';
import { Request } from 'express';
import { diskStorage } from 'multer';
import path, { extname } from 'path';
import * as fs from 'fs';
import {FirebaseService} from '../firebase/firebase.service';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService , private readonly firebaseService: FirebaseService) {}

  // ============ PUBLIC ENDPOINTS ============
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

    const filters: any = {};

    if (authorId) {
      filters.author = authorId;
    }

    if (isLive !== undefined) {
      filters.isLive = isLive === 'true';
    }
    if (isPublished !== undefined) {
      filters.isPublished = isPublished === 'true';
    }

    const sort: any = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

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

  // ============ PROTECTED ENDPOINTS ============
  // In posts.controller.ts
  // src/posts/posts.controller.ts
  // In posts.controller.ts

  // In posts.controller.ts, update the FileFieldsInterceptor:
  // posts.controller.ts - Updated createPost method
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'mainImage', maxCount: 1 },
        { name: 'video', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: (req, file, cb) => {
            let uploadPath = './uploads';

            if (file.fieldname === 'mainImage') {
              uploadPath = './uploads/posts/images';
            } else if (file.fieldname === 'video') {
              uploadPath = './uploads/posts/videos';
            }

            if (!fs.existsSync(uploadPath)) {
              fs.mkdirSync(uploadPath, { recursive: true });
            }

            cb(null, uploadPath);
          },
          filename: (req, file, callback) => {
            const uniqueSuffix =
              Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = extname(file.originalname);

            let prefix = file.fieldname;
            const filename = `${prefix}-${uniqueSuffix}${ext}`;
            callback(null, filename);
          },
        }),
      },
    ),
  )
  async createPost(
    @Req() req: Request,
    @UploadedFiles()
    files: {
      mainImage?: Express.Multer.File[];
      video?: Express.Multer.File[];
    },
    @Body() createPostDto: CreatePostDto,
  ) {
    const authorId = req.user['sub'];

    console.log('=== BACKEND: Creating post ===');
    console.log('Files received:', files);
    console.log('isLive VALUE:', createPostDto.isLive);
    console.log('isPublished VALUE:', createPostDto.isPublished);

    // Convert isLive manually
    let isLiveValue = false;
    if (req.body.isLive !== undefined) {
      if (req.body.isLive === 'false' || req.body.isLive === false) {
        isLiveValue = false;
      } else if (req.body.isLive === 'true' || req.body.isLive === true) {
        isLiveValue = true;
      }
    }

    // Convert isPublished manually
    let isPublishedValue = false;
    if (req.body.isPublished !== undefined) {
      if (req.body.isPublished === 'false' || req.body.isPublished === false) {
        isPublishedValue = false;
      } else if (
        req.body.isPublished === 'true' ||
        req.body.isPublished === true
      ) {
        isPublishedValue = true;
      }
    }

    const postData = {
      ...createPostDto,
      author: authorId,
      isLive: isLiveValue,
      isPublished: isPublishedValue,
    };

    // Handle main image (can be empty)
    if (files.mainImage && files.mainImage[0]) {
      postData.mainImage = `/uploads/posts/images/${files.mainImage[0].filename}`;
      console.log('✅ Main image saved to:', postData.mainImage);
    } else {
      postData.mainImage = '';
      console.log('ℹ️ No main image provided');
    }

    // Handle video (optional)
    if (files.video && files.video[0]) {
      postData.video = `/uploads/posts/videos/${files.video[0].filename}`;
      console.log('✅ Video saved to:', postData.video);
    }

    console.log('Final post data:', postData);

    try {
      const post = await this.postsService.create(postData, authorId);

      console.log('✅ Post created:', post._id);
      console.log('Post isLive:', post.isLive);
      console.log('Post isPublished:', post.isPublished);

      var notification = await this.firebaseService.sendToTopic("client","A New Post Added",post.title,{
        postId: post._id.toString(),
      });

      console.log(notification);

      return {
        success: true,
        message: 'Post created successfully',
        data: post,
      };
    } catch (error) {
      console.error('❌ Error creating post:', error);
      throw error;
    }
  }

  // ============ UPDATE POST WITH MULTIPLE FILES ============
  // posts.controller.ts
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @UseInterceptors(
    FileInterceptor('mainImage', {
      storage: diskStorage({
        destination: './uploads/posts/images',
        filename: (req, file, callback) => {
          // ✅ Add lots of logging to debug
          console.log('📸 Generating filename for:', file.originalname);

          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `mainImage-${uniqueSuffix}${ext}`;

          console.log('✅ Generated filename:', filename);
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        console.log('📸 File received:', file.originalname, file.mimetype);
        cb(null, true);
      },
    }),
  )
  async updatePost(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    console.log('=== UPDATE POST ===');
    console.log(
      'Received file:',
      file
        ? {
            originalname: file.originalname,
            filename: file.filename, // ✅ Check if this exists
            size: file.size,
          }
        : 'No file',
    );

    if (!updatePostDto) {
      throw new BadRequestException('No data provided');
    }

    // ✅ FIX: Set the image path
    if (file) {
      // Make sure file.filename exists
      if (!file.filename) {
        console.error('❌ file.filename is undefined!');
        throw new BadRequestException('File upload failed');
      }

      updatePostDto.mainImage = `/uploads/posts/images/${file.filename}`;
      console.log('✅ Image path set:', updatePostDto.mainImage);
    }

    // Update the post
    const updatedPost = await this.postsService.update(id, updatePostDto);

    return {
      success: true,
      message: 'Post updated successfully',
      data: updatedPost,
    };
  }
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN) // REMOVED EDITOR
  async deletePost(@Param('id') id: string, @Req() req: Request) {
    const adminId = req.user['sub'];
    const adminRole = req.user['role'] as Role;

    // Check if admin can delete this post
    const canDelete = await this.postsService.canAdminDeletePost(
      id,
      adminId,
      adminRole,
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
  @Roles(Role.SUPER_ADMIN, Role.ADMIN) // REMOVED EDITOR
  async toggleLiveStatus(@Param('id') id: string, @Req() req: Request) {
    const adminId = req.user['sub'];
    const adminRole = req.user['role'] as Role;

    // Check if user can edit this post
    const canEdit = await this.postsService.canAdminEditPost(
      id,
      adminId,
      adminRole,
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

  // ============ AUTHOR SPECIFIC ENDPOINTS ============
  @Get('author/my-posts')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN) // REMOVED EDITOR
  async getMyPosts(@Req() req: Request) {
    const authorId = req.user['sub'];
    const posts = await this.postsService.findByAuthor(authorId);

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

  // ============ STATISTICS ENDPOINTS ============
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

  // ============ BULK OPERATIONS ============
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

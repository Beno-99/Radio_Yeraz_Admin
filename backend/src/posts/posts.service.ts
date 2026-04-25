// src/posts/posts.service.ts
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Admin, Role } from '../admin/schemas/admin.schema';
import { NotificationGateway } from '../notifications/notification.gateway';
import { BadRequestException, NotFoundException,Injectable } from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PostsService {
  constructor(
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Admin.name) private adminModel: Model<any>,
    private notificationGateway: NotificationGateway,
  ) {}

  // ============ CREATE ============
  async create(
    createPostDto: CreatePostDto & { author: string },
    authorId: string,
  ): Promise<PostDocument> {
    console.log('=== SERVICE CREATE POST ===');
    console.log('DTO:', createPostDto);
    console.log('Author ID:', authorId);

    try {
      const author = await this.adminModel.findById(authorId);
      if (!author) {
        console.log('Author not found:', authorId);
        throw new NotFoundException('Author not found');
      }

      const post = new this.postModel({
        ...createPostDto,
        author: authorId,
        postedDate: new Date(),
      });

      const savedPost = await post.save();
      console.log('Post saved:', savedPost._id);

      // ── Notification logic ───────────────────────────────────────
      try {
        const authorName =
          author.displayName || author.username || author.email || 'Admin';

        if (savedPost.isPublished) {
          // Published → notify everyone (mobile + admin)
          await this.notificationGateway.emitNewPost(savedPost, authorName);
          console.log('✅ Published notification emitted to everyone');
        } else {
          // Draft → notify admin dashboard only
          await this.notificationGateway.emitNewDraft(savedPost, authorName);
          console.log('✅ Draft notification emitted to admin only');
        }
      } catch (notifError) {
        console.error('⚠️ Notification emit failed:', (notifError as Error).message);
      }
      // ────────────────────────────────────────────────────────────

      return savedPost.populate('author', 'username displayName role');
    } catch (error) {
      console.error('Service create error:', error);
      console.error('Error stack:', (error as Error).stack);
      throw error;
    }
  }

  // ============ READ ============
  async findAll(
    page: number = 1,
    limit: number = 10,
    filters: any = {},
    sort: any = { postedDate: -1 },
    search?: string,
  ): Promise<{
    data: PostDocument[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;
    const query: any = { ...filters };

    if (query.author && typeof query.author === 'string') {
      query.author = new Types.ObjectId(query.author);
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { profileName: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.postModel
        .find(query)
        .populate('author', 'username displayName role')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.postModel.countDocuments(query),
    ]);

    return {
      data,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<PostDocument> {
    if (!isValidObjectId(id)) {
    throw new BadRequestException('Invalid post id');
  }
    const post = await this.postModel
      .findById(id)
      .populate('author', 'username displayName role')
      .exec();

    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async findByAuthor(authorId: string): Promise<PostDocument[]> {
    return this.postModel
      .find({ author: new Types.ObjectId(authorId) })
      .populate('author', 'username displayName role')
      .sort({ postedDate: -1 })
      .exec();
  }

  async findLivePosts() {
    return this.postModel
      .find({ isLive: true, isPublished: true })
      .populate('author', 'username displayName')
      .sort({ postedDate: -1 })
      .exec();
  }

  async findRecentPosts(limit: number = 5) {
    return this.postModel
      .find({ isPublished: true })
      .populate('author', 'username displayName')
      .sort({ postedDate: -1 })
      .limit(limit)
      .exec();
  }

  async searchPosts(query: string, limit: number = 20) {
    return this.postModel
      .find({
        isPublished: true,
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { location: { $regex: query, $options: 'i' } },
        ],
      })
      .populate('author', 'username displayName')
      .sort({ postedDate: -1 })
      .limit(limit)
      .exec();
  }

  // ============ UPDATE ============
  async update(
    id: string,
    updatePostDto: UpdatePostDto,
  ): Promise<PostDocument> {
    // Get old post to check if isPublished changed
    const oldPost = await this.postModel.findById(id).exec();

    const updateData: any = { ...updatePostDto };
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );
    updateData.updatedAt = new Date();

    const post = await this.postModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();

    if (!post) throw new NotFoundException('Post not found');

    // ── Notification logic ───────────────────────────────────────
    try {
      const author = await this.adminModel.findById(post.author);
      const authorName =
        author?.displayName || author?.username || author?.email || 'Admin';

      if (!oldPost?.isPublished && post.isPublished) {
        // Was draft → now published: notify everyone (mobile + admin)
        await this.notificationGateway.emitNewPost(post, authorName);
        console.log('✅ Post published — notification sent to everyone');
      } else {
        // Just updated → notify admin only
        await this.notificationGateway.emitPostUpdated(post, authorName);
        console.log('✅ Post updated — notification sent to admin only');
      }
    } catch (notifError) {
      console.error('⚠️ Notification emit failed:', notifError instanceof Error ? notifError.message : String(notifError));
    }
    // ────────────────────────────────────────────────────────────

    return post;
  }

  async toggleLiveStatus(id: string): Promise<PostDocument> {
    const post = await this.postModel.findById(id);
    if (!post) throw new NotFoundException('Post not found');

    post.isLive = !post.isLive;
    post.updatedAt = new Date();
    await post.save();

    try {
      if (post.isLive) {
        const author = await this.adminModel.findById(post.author);
        const authorName =
          author?.displayName || author?.username || author?.email || 'Admin';
        await this.notificationGateway.emitPostPublished(post, authorName);
      }
    } catch (notifError) {
      console.error('⚠️ Notification emit failed:', notifError instanceof Error ? notifError.message : String(notifError));
    }

    return post.populate('author', 'username displayName role');
  }

  // ============ DELETE WITH MEDIA CLEANUP ============
  async delete(id: string): Promise<PostDocument> {
    console.log('=== DELETING POST WITH MEDIA CLEANUP ===');

    const post = await this.postModel.findById(id).exec();
    if (!post) throw new NotFoundException('Post not found');

    console.log('🗑️ Deleting post:', post.title);
    console.log('📸 mainImage:', post.mainImage || 'none');
    console.log('🎥 video:', post.video || 'none');

    try {
      if (post.mainImage && post.mainImage.trim() !== '') {
        const possiblePaths = [
          post.mainImage,
          post.mainImage.startsWith('/uploads')
            ? post.mainImage
            : `/uploads${post.mainImage}`,
          post.mainImage.startsWith('/')
            ? post.mainImage
            : `/${post.mainImage}`,
        ];

        for (const filePath of possiblePaths) {
          const fullPath = path.join(process.cwd(), filePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log('✅ Image deleted successfully');
            break;
          }
        }
      }

      if (post.video && post.video.trim() !== '') {
        const possiblePaths = [
          post.video,
          post.video.startsWith('/uploads')
            ? post.video
            : `/uploads${post.video}`,
          post.video.startsWith('/') ? post.video : `/${post.video}`,
        ];

        for (const filePath of possiblePaths) {
          const fullPath = path.join(process.cwd(), filePath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log('✅ Video deleted successfully');
            break;
          }
        }
      }
    } catch (error) {
      console.error('❌ Error deleting media files:', error);
    }

    // Admin only notification for delete
    try {
      const author = await this.adminModel.findById(post.author);
      const authorName =
        author?.displayName || author?.username || author?.email || 'Admin';
      await this.notificationGateway.emitPostDeleted(post.title, authorName);
    } catch (notifError) {
      console.error('⚠️ Notification emit failed:', notifError instanceof Error ? notifError.message : String(notifError));
    }

    const deletedPost = await this.postModel
      .findByIdAndDelete(id)
      .populate('author', 'username displayName role')
      .exec();

    console.log('✅ Post document deleted successfully from MongoDB');
    return deletedPost;
  }

  // ============ AUTHORIZATION ============
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
      const post = await this.postModel.findById(postId);
      if (!post) return false;
      return post.author.toString() === adminId;
    }

    return false;
  }

  // ============ STATISTICS ============
  async getStatistics(): Promise<any> {
    const [total, live, byAuthor, recentPosts, postsByMonth] =
      await Promise.all([
        this.postModel.countDocuments(),
        this.postModel.countDocuments({ isLive: true }),
        this.postModel.aggregate([
          { $group: { _id: '$author', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
        ]),
        this.postModel
          .find()
          .sort({ postedDate: -1 })
          .limit(5)
          .populate('author', 'username displayName')
          .exec(),
        this.postModel.aggregate([
          {
            $group: {
              _id: {
                year: { $year: '$postedDate' },
                month: { $month: '$postedDate' },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } },
          { $limit: 6 },
        ]),
      ]);

    return {
      total,
      live,
      draft: total - live,
      topAuthors: byAuthor,
      recentPosts,
      postsByMonth,
    };
  }

  // ============ BULK OPERATIONS ============
  async bulkUpdateIsLive(ids: string[], isLive: boolean): Promise<number> {
    const result = await this.postModel.updateMany(
      { _id: { $in: ids } },
      { isLive, updatedAt: new Date() },
    );
    return result.modifiedCount;
  }

  async deleteByAuthor(authorId: string): Promise<number> {
    console.log('=== BULK DELETE BY AUTHOR ===');

    const posts = await this.postModel
      .find({ author: new Types.ObjectId(authorId) })
      .exec();

    console.log(`Found ${posts.length} posts to delete`);

    let mediaFilesDeleted = 0;
    posts.forEach((post) => {
      try {
        if (post.mainImage && post.mainImage.trim() !== '') {
          const imagePath = path.join(process.cwd(), post.mainImage);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
            mediaFilesDeleted++;
          }
        }
        if (post.video && post.video.trim() !== '') {
          const videoPath = path.join(process.cwd(), post.video);
          if (fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath);
            mediaFilesDeleted++;
          }
        }
      } catch (error) {
        console.error(`Error deleting media for post ${post._id}:`, error);
      }
    });

    console.log(`Deleted ${mediaFilesDeleted} media files`);

    const result = await this.postModel.deleteMany({
      author: new Types.ObjectId(authorId),
    });

    console.log(`Deleted ${result.deletedCount} post documents`);
    return result.deletedCount;
  }
}

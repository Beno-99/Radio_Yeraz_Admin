import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Admin, Role } from '../admin/schemas/admin.schema';
import { NotificationGateway } from '../notifications/notification.gateway';
import {
  BadRequestException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
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

  private calculateExpiryFromEventDate(eventDate?: string | Date): Date | null {
    if (!eventDate) return null;
    const event = new Date(eventDate);
    if (Number.isNaN(event.getTime())) return null;
    return new Date(event.getTime() + 5 * 24 * 60 * 60 * 1000);
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

  private async expirePostsPastEventWindow(): Promise<number> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const result = await this.postModel.updateMany(
      {
        eventDate: { $exists: true, $ne: null, $lte: cutoff },
        isPublished: true,
      },
      {
        $set: {
          isPublished: false,
          isLive: false,
          status: 'expired',
          updatedAt: now,
        },
      },
    );

    return result.modifiedCount;
  }

  async create(
    createPostDto: CreatePostDto & { author: string },
    authorId: string,
  ): Promise<PostDocument> {
    try {
      const author = await this.adminModel.findById(authorId);
      if (!author) throw new NotFoundException('Author not found');

      const isPublishedValue = Boolean(createPostDto.isPublished);
const isLiveValue = Boolean(createPostDto.isLive);

      const calculatedExpiresAt = this.calculateExpiryFromEventDate(
        createPostDto.eventDate,
      );

      const post = new this.postModel({
        ...createPostDto,
        author: authorId,
        postedDate: new Date(),
        expiresAt:
          calculatedExpiresAt ||
          new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        status: isPublishedValue ? 'published' : 'draft',
        isPublished: isPublishedValue,
        isLive: isLiveValue,
      });

      const savedPost = await post.save();

      try {
        const authorName =
          author.displayName || author.username || author.email || 'Admin';

        if (savedPost.isPublished) {
          await this.notificationGateway.emitNewPost(savedPost, authorName);
        } else {
          await this.notificationGateway.emitNewDraft(savedPost, authorName);
        }
      } catch (notifError) {
        console.error('⚠️ Notification emit failed:', (notifError as Error).message);
      }

      return savedPost.populate('author', 'username displayName role');
    } catch (error) {
      throw error;
    }
  }

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
    await this.expirePostsPastEventWindow();

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
    await this.expirePostsPastEventWindow();

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
    await this.expirePostsPastEventWindow();

    return this.postModel
      .find({ author: new Types.ObjectId(authorId) })
      .populate('author', 'username displayName role')
      .sort({ postedDate: -1 })
      .exec();
  }

  async findLivePosts() {
    await this.expirePostsPastEventWindow();

    const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    return this.postModel
      .find({
        isLive: true,
        isPublished: true,
        status: 'published',
        $or: [
          { eventDate: { $exists: false } },
          { eventDate: null },
          { eventDate: { $gt: cutoff } },
        ],
      })
      .populate('author', 'username displayName')
      .sort({ postedDate: -1 })
      .exec();
  }

  async findRecentPosts(limit: number = 5) {
    await this.expirePostsPastEventWindow();

    const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    return this.postModel
      .find({
        isPublished: true,
        status: 'published',
        $or: [
          { eventDate: { $exists: false } },
          { eventDate: null },
          { eventDate: { $gt: cutoff } },
        ],
      })
      .populate('author', 'username displayName')
      .sort({ postedDate: -1 })
      .limit(limit)
      .exec();
  }

  async searchPosts(query: string, limit: number = 20) {
    await this.expirePostsPastEventWindow();

    const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);

    return this.postModel
      .find({
        isPublished: true,
        status: 'published',
        $and: [
          {
            $or: [
              { eventDate: { $exists: false } },
              { eventDate: null },
              { eventDate: { $gt: cutoff } },
            ],
          },
          {
            $or: [
              { title: { $regex: query, $options: 'i' } },
              { description: { $regex: query, $options: 'i' } },
              { location: { $regex: query, $options: 'i' } },
            ],
          },
        ],
      })
      .populate('author', 'username displayName')
      .sort({ postedDate: -1 })
      .limit(limit)
      .exec();
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
  ): Promise<PostDocument> {
    const oldPost = await this.postModel.findById(id).exec();
    if (!oldPost) throw new NotFoundException('Post not found');

    const oldMainImage = oldPost.mainImage || '';
    const oldVideo = oldPost.video || '';

    const updateData: any = { ...updatePostDto };
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key],
    );
    updateData.updatedAt = new Date();

    if (updateData.isPublished !== undefined) {
      updateData.isPublished =
        updateData.isPublished === true || updateData.isPublished === 'true';
    }

    if (updateData.isLive !== undefined) {
      updateData.isLive =
        updateData.isLive === true || updateData.isLive === 'true';
    }

    if (updateData.eventDate !== undefined && oldPost?.eventDate) {
      const oldEventDate = new Date(oldPost.eventDate).getTime();
      const newEventDate = new Date(updateData.eventDate).getTime();

      if (!Number.isNaN(newEventDate) && oldEventDate !== newEventDate) {
        updateData.isPublished = true;
        updateData.status = 'published';
      }
    }

    if (updateData.eventDate !== undefined) {
      const recalculatedExpiresAt = this.calculateExpiryFromEventDate(
        updateData.eventDate,
      );
      if (recalculatedExpiresAt) {
        updateData.expiresAt = recalculatedExpiresAt;
      }
    }

    if (updateData.isPublished !== undefined) {
      updateData.status = updateData.isPublished ? 'published' : 'draft';
    }

    const shouldRemoveImage = updateData.removeImage === 'true';
    const shouldRemoveVideo = updateData.removeVideo === 'true';
    const hasNewImage = !!updateData.mainImage;
    const hasNewVideo = !!updateData.video;

    if (shouldRemoveImage) {
      updateData.mainImage = '';
    }
    if (shouldRemoveVideo) {
      updateData.video = '';
    }

    delete updateData.removeImage;
    delete updateData.removeVideo;

    const post = await this.postModel
      .findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .exec();

    if (!post) throw new NotFoundException('Post not found');

    try {
      if ((shouldRemoveImage || hasNewImage) && oldMainImage.trim() !== '') {
        const replacedWithDifferentImage =
          hasNewImage && oldMainImage !== post.mainImage;
        if (shouldRemoveImage || replacedWithDifferentImage) {
          this.deleteMediaFileIfExists(oldMainImage);
        }
      }

      if ((shouldRemoveVideo || hasNewVideo) && oldVideo.trim() !== '') {
        const replacedWithDifferentVideo = hasNewVideo && oldVideo !== post.video;
        if (shouldRemoveVideo || replacedWithDifferentVideo) {
          this.deleteMediaFileIfExists(oldVideo);
        }
      }
    } catch (fileError) {
      console.error('⚠️ Failed to delete replaced/removed media file:', fileError);
    }

    try {
      const author = await this.adminModel.findById(post.author);
      const authorName =
        author?.displayName || author?.username || author?.email || 'Admin';

      const becamePublished =
        (!oldPost?.isPublished && post.isPublished) ||
        (oldPost?.status !== 'published' && post.status === 'published');

      if (becamePublished) {
        await this.notificationGateway.emitNewPost(post, authorName);
      } else {
        await this.notificationGateway.emitPostUpdated(post, authorName);
      }
    } catch (notifError) {
      console.error(
        '⚠️ Notification emit failed:',
        notifError instanceof Error ? notifError.message : String(notifError),
      );
    }

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
      console.error(
        '⚠️ Notification emit failed:',
        notifError instanceof Error ? notifError.message : String(notifError),
      );
    }

    return post.populate('author', 'username displayName role');
  }

  async republish(id: string): Promise<PostDocument> {
    const post = await this.postModel.findById(id);
    if (!post) throw new NotFoundException('Post not found');

    post.status = 'published';
    post.isPublished = true;
    post.isLive = true;
    post.postedDate = new Date();
    post.expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    post.updatedAt = new Date();

    await post.save();
    return post.populate('author', 'username displayName role');
  }

  async delete(id: string): Promise<PostDocument> {
    const post = await this.postModel.findById(id).exec();
    if (!post) throw new NotFoundException('Post not found');

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
            break;
          }
        }
      }
    } catch (error) {
      console.error('❌ Error deleting media files:', error);
    }

    try {
      const author = await this.adminModel.findById(post.author);
      const authorName =
        author?.displayName || author?.username || author?.email || 'Admin';
      await this.notificationGateway.emitPostDeleted(post.title, authorName);
    } catch (notifError) {
      console.error(
        '⚠️ Notification emit failed:',
        notifError instanceof Error ? notifError.message : String(notifError),
      );
    }

    const deletedPost = await this.postModel
      .findByIdAndDelete(id)
      .populate('author', 'username displayName role')
      .exec();

    return deletedPost;
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
      const post = await this.postModel.findById(postId);
      if (!post) return false;
      return post.author.toString() === adminId;
    }

    return false;
  }

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

  async bulkUpdateIsLive(ids: string[], isLive: boolean): Promise<number> {
    const result = await this.postModel.updateMany(
      { _id: { $in: ids } },
      { isLive, updatedAt: new Date() },
    );
    return result.modifiedCount;
  }

  async deleteByAuthor(authorId: string): Promise<number> {
    const posts = await this.postModel
      .find({ author: new Types.ObjectId(authorId) })
      .exec();

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

    const result = await this.postModel.deleteMany({
      author: new Types.ObjectId(authorId),
    });

    return result.deletedCount;
  }
}

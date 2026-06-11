// src/admin/admin.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Admin, AdminDocument, Role } from './schemas/admin.schema';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { Post, PostDocument } from 'src/posts/schemas/post.schema';
import { Ad, AdDocument } from 'src/ads/schemas/ad.schema';
import { NotificationGateway } from '../notifications/notification.gateway';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    @InjectModel(Post.name) private postModel: Model<PostDocument>,
    @InjectModel(Ad.name) private adModel: Model<AdDocument>,
    private notificationGateway: NotificationGateway, // ← ADDED
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async validateAdmin(
    username: string,
    password: string,
  ): Promise<AdminDocument | null> {
    console.log('Validating admin:', username);
    const admin = await this.adminModel.findOne({ username });
    console.log('Admin found:', admin ? 'Yes' : 'No');

    if (!admin) return null;

    console.log('Admin isActive:', admin.isActive);
    if (!admin.isActive) return null;

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) return null;

    admin.lastLogin = new Date();
    await admin.save();

    return admin;
  }

  async createAdmin(
    creatorId: string,
    createAdminDto: CreateAdminDto,
  ): Promise<AdminDocument> {
    const creator = await this.adminModel.findById(creatorId);
    if (!creator) throw new NotFoundException('Creator admin not found');

    if (creator.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can create new admins');
    }

    const existingAdmin = await this.adminModel.findOne({
      username: createAdminDto.username,
    });
    if (existingAdmin) throw new ConflictException('Username already exists');

    const hashedPassword = await this.hashPassword(createAdminDto.password);

    const admin = new this.adminModel({
      ...createAdminDto,
      password: hashedPassword,
      role: Role.ADMIN,
    });

    await admin.save();

    // ── Notify admins ─────────────────────────────────────────
    try {
      const creatorName =
        creator.displayName || creator.username || 'Super Admin';
      await this.notificationGateway.emitAdminCreated(admin, creatorName);
    } catch (e: unknown) {
  console.error(
    '⚠️ Admin notification failed:',
    e instanceof Error ? e.message : String(e),
  );
}
    // ─────────────────────────────────────────────────────────

    return admin;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters: any = {},
  ): Promise<{
    data: AdminDocument[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;
    const query: any = { ...filters };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.adminModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.adminModel.countDocuments(query),
    ]);

    return { data, total, page, pages: Math.ceil(total / limit) };
  }

  async findById(id: string) {
    console.log('Received ID:', id, 'Type:', typeof id);
    if (!id || id === 'undefined') {
      throw new BadRequestException('Invalid ID');
    }

    const admin = await this.adminModel.findById(id).exec();
    if (!admin) throw new NotFoundException('Admin not found');
    return admin;
  }

  async findByUsername(username: string): Promise<AdminDocument | null> {
    return this.adminModel.findOne({ username });
  }

  async updateAdmin(
    id: string,
    updateAdminDto: UpdateAdminDto,
    updaterName: string = 'Admin', // ← ADDED
  ): Promise<AdminDocument> {
    if (updateAdminDto.username) {
      const existingAdmin = await this.adminModel.findOne({
        username: updateAdminDto.username,
        _id: { $ne: id },
      });
      if (existingAdmin) throw new ConflictException('Username already taken');
    }

    if (updateAdminDto.password) {
      updateAdminDto.password = await this.hashPassword(
        updateAdminDto.password,
      );
    }

    const admin = await this.adminModel
      .findByIdAndUpdate(
        id,
        { ...updateAdminDto, updatedAt: new Date() },
        { new: true, runValidators: true },
      )
      .exec();

    if (!admin) throw new NotFoundException('Admin not found');

    // ── Notify admins ─────────────────────────────────────────
    try {
      await this.notificationGateway.emitAdminUpdated(admin, updaterName);
    } catch (e: unknown) {
  console.error(
    '⚠️ Admin notification failed:',
    e instanceof Error ? e.message : String(e),
  );
}
    // ─────────────────────────────────────────────────────────

    return admin;
  }

  async deleteAdmin(
    id: string,
    deleterName: string = 'Admin', // ← ADDED
  ): Promise<AdminDocument> {
    const admin = await this.adminModel.findByIdAndDelete(id);
    if (!admin) throw new NotFoundException('Admin not found');

    // ── Notify admins ─────────────────────────────────────────
    try {
      await this.notificationGateway.emitAdminDeleted(
        admin.displayName || admin.username,
        deleterName,
      );
    } catch (e: unknown) {
  console.error(
    '⚠️ Admin notification failed:',
    e instanceof Error ? e.message : String(e),
  );
}
    // ─────────────────────────────────────────────────────────

    return admin;
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const admin = await this.adminModel.findById(id);
    if (!admin) throw new NotFoundException('Admin not found');

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    admin.password = await this.hashPassword(newPassword);
    admin.updatedAt = new Date();
    await admin.save();
  }

  async toggleActiveStatus(
    id: string,
    togglerName: string = 'Admin', // ← ADDED
  ): Promise<AdminDocument> {
    const admin = await this.adminModel.findById(id);
    if (!admin) throw new NotFoundException('Admin not found');

    admin.isActive = !admin.isActive;
    admin.updatedAt = new Date();
    await admin.save();

    // ── Notify admins ─────────────────────────────────────────
    try {
      await this.notificationGateway.emitAdminToggled(admin, togglerName);
    } catch (e: unknown) {
  console.error(
    '⚠️ Admin notification failed:',
    e instanceof Error ? e.message : String(e),
  );
}
    // ─────────────────────────────────────────────────────────

    return admin;
  }

  async getStatistics(): Promise<any> {
    const [total, active, superAdmins, admins, latestAdmins] =
      await Promise.all([
        this.adminModel.countDocuments(),
        this.adminModel.countDocuments({ isActive: true }),
        this.adminModel.countDocuments({ role: Role.SUPER_ADMIN }),
        this.adminModel.countDocuments({ role: Role.ADMIN }),
        this.adminModel.find().sort({ createdAt: -1 }).limit(5).exec(),
      ]);

    return {
      total,
      active,
      inactive: total - active,
      byRole: { superAdmins, admins },
      latestAdmins,
    };
  }

  async getAdminsByRole(role: Role): Promise<AdminDocument[]> {
    return this.adminModel
      .find({ role, isActive: true })
      .sort({ username: 1 })
      .exec();
  }

  async getActiveAdmins(): Promise<AdminDocument[]> {
    return this.adminModel
      .find({ isActive: true })
      .sort({ username: 1 })
      .exec();
  }

  async searchAdmins(query: string): Promise<AdminDocument[]> {
    return this.adminModel
      .find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { displayName: { $regex: query, $options: 'i' } },
        ],
      })
      .sort({ username: 1 })
      .exec();
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.adminModel.findByIdAndUpdate(id, {
      lastLogin: new Date(),
      updatedAt: new Date(),
    });
  }

  async canAdminManageOtherAdmins(
    adminId: string,
    adminRole: Role,
  ): Promise<boolean> {
    return adminRole === Role.SUPER_ADMIN;
  }

  async canAdminViewAllAdmins(
    adminId: string,
    adminRole: Role,
  ): Promise<boolean> {
    return adminRole === Role.SUPER_ADMIN || adminRole === Role.ADMIN;
  }
}

// src/admin/admin.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Admin as PrismaAdmin, AdminRole, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createObjectIdString } from '../common/utils/object-id.utils';
import { NotificationGateway } from '../notifications/notification.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { Role } from './schemas/admin.schema';

export interface AdminResponse
  extends Omit<PrismaAdmin, 'role'> {
  _id: string;
  role: Role;
  __v: number;
}

interface AdminListFilters {
  role?: Role;
  isActive?: boolean;
}

export interface AdminStatistics {
  total: number;
  active: number;
  inactive: number;
  byRole: {
    superAdmins: number;
    admins: number;
  };
  latestAdmins: AdminResponse[];
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  private toPrismaRole(role: Role): AdminRole {
    return role === Role.SUPER_ADMIN ? AdminRole.SUPER_ADMIN : AdminRole.ADMIN;
  }

  private toApiRole(role: AdminRole): Role {
    return role === AdminRole.SUPER_ADMIN ? Role.SUPER_ADMIN : Role.ADMIN;
  }

  private toAdminResponse(admin: PrismaAdmin): AdminResponse {
    return {
      ...admin,
      _id: admin.id,
      role: this.toApiRole(admin.role),
      __v: 0,
    };
  }

  private async ensureActiveSuperAdminRemains(
    admin: PrismaAdmin,
    nextRole: AdminRole = admin.role,
    nextIsActive: boolean = admin.isActive,
  ): Promise<void> {
    const isRemovingActiveSuperAdmin =
      admin.role === AdminRole.SUPER_ADMIN &&
      admin.isActive &&
      (nextRole !== AdminRole.SUPER_ADMIN || !nextIsActive);

    if (!isRemovingActiveSuperAdmin) return;

    const activeSuperAdminCount = await this.prisma.admin.count({
      where: {
        role: AdminRole.SUPER_ADMIN,
        isActive: true,
      },
    });

    if (activeSuperAdminCount <= 1) {
      throw new BadRequestException(
        'At least one active SUPER_ADMIN account is required',
      );
    }
  }

  async validateAdmin(
    username: string,
    password: string,
  ): Promise<AdminResponse | null> {
    const admin = await this.prisma.admin.findUnique({
      where: { username },
    });

    if (!admin || !admin.isActive) return null;

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) return null;

    const updatedAdmin = await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date(), updatedAt: new Date() },
    });

    return this.toAdminResponse(updatedAdmin);
  }

  async createAdmin(
    creatorId: string,
    createAdminDto: CreateAdminDto,
  ): Promise<AdminResponse> {
    const creator = await this.prisma.admin.findUnique({
      where: { id: creatorId },
    });
    if (!creator) throw new NotFoundException('Creator admin not found');

    if (creator.role !== AdminRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can create new admins');
    }

    const existingAdmin = await this.prisma.admin.findFirst({
      where: {
        username: createAdminDto.username,
      },
    });
    if (existingAdmin) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await this.hashPassword(createAdminDto.password);

    const admin = await this.prisma.admin.create({
      data: {
        id: createObjectIdString(),
        username: createAdminDto.username,
        password: hashedPassword,
        displayName: createAdminDto.displayName,
        role: AdminRole.ADMIN,
        isActive: createAdminDto.isActive ?? true,
      },
    });

    const adminResponse = this.toAdminResponse(admin);

    try {
      const creatorName =
        creator.displayName || creator.username || 'Super Admin';
      await this.notificationGateway.emitAdminCreated(
        adminResponse,
        creatorName,
      );
    } catch (e: unknown) {
      console.error(
        'Admin notification failed:',
        e instanceof Error ? e.message : String(e),
      );
    }

    return adminResponse;
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    search?: string,
    filters: AdminListFilters = {},
  ): Promise<{
    data: AdminResponse[];
    total: number;
    page: number;
    pages: number;
  }> {
    const skip = (page - 1) * limit;
    const where: Prisma.AdminWhereInput = {};

    if (filters.role) where.role = this.toPrismaRole(filters.role);
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { displayName: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.admin.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.admin.count({ where }),
    ]);

    return {
      data: data.map((admin) => this.toAdminResponse(admin)),
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  async findById(id: string): Promise<AdminResponse> {
    if (!id || id === 'undefined') {
      throw new BadRequestException('Invalid ID');
    }

    const admin = await this.prisma.admin.findUnique({
      where: { id },
    });
    if (!admin) throw new NotFoundException('Admin not found');
    return this.toAdminResponse(admin);
  }

  async findByUsername(username: string): Promise<AdminResponse | null> {
    const admin = await this.prisma.admin.findUnique({
      where: { username },
    });

    return admin ? this.toAdminResponse(admin) : null;
  }

  async updateAdmin(
    id: string,
    updateAdminDto: UpdateAdminDto,
    updaterName: string = 'Admin',
  ): Promise<AdminResponse> {
    const existingTarget = await this.prisma.admin.findUnique({
      where: { id },
    });
    if (!existingTarget) throw new NotFoundException('Admin not found');

    if (updateAdminDto.username) {
      const existingAdmin = await this.prisma.admin.findFirst({
        where: {
          username: updateAdminDto.username,
          NOT: { id },
        },
      });
      if (existingAdmin) {
        throw new ConflictException('Username already taken');
      }
    }

    const updateData: Prisma.AdminUpdateInput = {
      updatedAt: new Date(),
    };

    if (updateAdminDto.username !== undefined) {
      updateData.username = updateAdminDto.username;
    }
    if (updateAdminDto.displayName !== undefined) {
      updateData.displayName = updateAdminDto.displayName;
    }
    if (updateAdminDto.isActive !== undefined) {
      updateData.isActive = updateAdminDto.isActive;
    }
    if (updateAdminDto.role !== undefined) {
      updateData.role = this.toPrismaRole(updateAdminDto.role);
    }
    if (updateAdminDto.password) {
      updateData.password = await this.hashPassword(updateAdminDto.password);
    }

    await this.ensureActiveSuperAdminRemains(
      existingTarget,
      updateAdminDto.role !== undefined
        ? this.toPrismaRole(updateAdminDto.role)
        : existingTarget.role,
      updateAdminDto.isActive !== undefined
        ? updateAdminDto.isActive
        : existingTarget.isActive,
    );

    const admin = await this.prisma.admin.update({
      where: { id },
      data: updateData,
    });

    const adminResponse = this.toAdminResponse(admin);

    try {
      await this.notificationGateway.emitAdminUpdated(
        adminResponse,
        updaterName,
      );
    } catch (e: unknown) {
      console.error(
        'Admin notification failed:',
        e instanceof Error ? e.message : String(e),
      );
    }

    return adminResponse;
  }

  async updateOwnProfile(
    id: string,
    updateProfileDto: UpdateAdminProfileDto,
    updaterName: string = 'Admin',
  ): Promise<AdminResponse> {
    return this.updateAdmin(
      id,
      {
        username: updateProfileDto.username,
        displayName: updateProfileDto.displayName,
      },
      updaterName,
    );
  }

  async deleteAdmin(
    id: string,
    deleterName: string = 'Admin',
  ): Promise<AdminResponse> {
    const existingAdmin = await this.prisma.admin.findUnique({
      where: { id },
    });
    if (!existingAdmin) throw new NotFoundException('Admin not found');

    await this.ensureActiveSuperAdminRemains(
      existingAdmin,
      AdminRole.ADMIN,
      false,
    );

    const admin = await this.prisma.admin.delete({
      where: { id },
    });

    const adminResponse = this.toAdminResponse(admin);

    try {
      await this.notificationGateway.emitAdminDeleted(
        admin.displayName || admin.username,
        deleterName,
      );
    } catch (e: unknown) {
      console.error(
        'Admin notification failed:',
        e instanceof Error ? e.message : String(e),
      );
    }

    return adminResponse;
  }

  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const admin = await this.prisma.admin.findUnique({
      where: { id },
    });
    if (!admin) throw new NotFoundException('Admin not found');

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    await this.prisma.admin.update({
      where: { id },
      data: {
        password: await this.hashPassword(newPassword),
        updatedAt: new Date(),
      },
    });
  }

  async toggleActiveStatus(
    id: string,
    togglerName: string = 'Admin',
  ): Promise<AdminResponse> {
    const existingAdmin = await this.prisma.admin.findUnique({
      where: { id },
    });
    if (!existingAdmin) throw new NotFoundException('Admin not found');

    await this.ensureActiveSuperAdminRemains(
      existingAdmin,
      existingAdmin.role,
      !existingAdmin.isActive,
    );

    const admin = await this.prisma.admin.update({
      where: { id },
      data: {
        isActive: !existingAdmin.isActive,
        updatedAt: new Date(),
      },
    });

    const adminResponse = this.toAdminResponse(admin);

    try {
      await this.notificationGateway.emitAdminToggled(
        adminResponse,
        togglerName,
      );
    } catch (e: unknown) {
      console.error(
        'Admin notification failed:',
        e instanceof Error ? e.message : String(e),
      );
    }

    return adminResponse;
  }

  async getStatistics(): Promise<AdminStatistics> {
    const [total, active, superAdmins, admins, latestAdmins] =
      await Promise.all([
        this.prisma.admin.count(),
        this.prisma.admin.count({ where: { isActive: true } }),
        this.prisma.admin.count({ where: { role: AdminRole.SUPER_ADMIN } }),
        this.prisma.admin.count({ where: { role: AdminRole.ADMIN } }),
        this.prisma.admin.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

    return {
      total,
      active,
      inactive: total - active,
      byRole: { superAdmins, admins },
      latestAdmins: latestAdmins.map((admin) => this.toAdminResponse(admin)),
    };
  }

  async getAdminsByRole(role: Role): Promise<AdminResponse[]> {
    const admins = await this.prisma.admin.findMany({
      where: {
        role: this.toPrismaRole(role),
        isActive: true,
      },
      orderBy: { username: 'asc' },
    });

    return admins.map((admin) => this.toAdminResponse(admin));
  }

  async getActiveAdmins(): Promise<AdminResponse[]> {
    const admins = await this.prisma.admin.findMany({
      where: { isActive: true },
      orderBy: { username: 'asc' },
    });

    return admins.map((admin) => this.toAdminResponse(admin));
  }

  async searchAdmins(query: string): Promise<AdminResponse[]> {
    const admins = await this.prisma.admin.findMany({
      where: {
        OR: [
          { username: { contains: query } },
          { displayName: { contains: query } },
        ],
      },
      orderBy: { username: 'asc' },
    });

    return admins.map((admin) => this.toAdminResponse(admin));
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.admin.update({
      where: { id },
      data: {
        lastLogin: new Date(),
        updatedAt: new Date(),
      },
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

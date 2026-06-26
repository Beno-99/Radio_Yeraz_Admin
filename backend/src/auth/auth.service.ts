// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Admin as PrismaAdmin, AdminRole, RefreshToken } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { LoginAdminDto } from '../admin/dto/login-admin.dto';
import { Role } from '../admin/schemas/admin.schema';
import { createObjectIdString } from '../common/utils/object-id.utils';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenResponseDto } from './dto/token-response.dto';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface SafeAdminResponse
  extends Omit<PrismaAdmin, 'password' | 'role'> {
  _id: string;
  role: Role;
  __v: number;
}

export interface RefreshTokenResponse extends Omit<RefreshToken, 'adminId'> {
  _id: string;
  admin: string;
  __v: number;
}

interface JwtTokenPayload {
  sub: string;
  username?: string;
  role?: Role;
  type?: string;
  iat?: number;
  exp?: number;
}

interface AdminProfileUpdateData {
  username?: string;
  password?: string;
  displayName?: string;
  isActive?: boolean;
  lastLogin?: Date;
  role?: Role;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ============ TOKEN GENERATION METHODS ============
  private generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  private toApiRole(role: AdminRole): Role {
    return role === AdminRole.SUPER_ADMIN ? Role.SUPER_ADMIN : Role.ADMIN;
  }

  private toSafeAdminResponse(admin: PrismaAdmin): SafeAdminResponse {
    const { password, role, ...adminWithoutPassword } = admin;
    void password;

    return {
      ...adminWithoutPassword,
      _id: admin.id,
      role: this.toApiRole(role),
      __v: 0,
    };
  }

  private toRefreshTokenResponse(token: RefreshToken): RefreshTokenResponse {
    const { adminId, ...tokenWithoutAdminId } = token;

    return {
      ...tokenWithoutAdminId,
      _id: token.id,
      admin: adminId,
      __v: 0,
    };
  }

  private generateAccessToken(admin: PrismaAdmin): string {
    return this.jwtService.sign(
      {
        sub: admin.id,
        username: admin.username,
        role: this.toApiRole(admin.role),
      },
      {
        expiresIn: '1h',
      },
    );
  }

  private getRefreshTokenExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
  }

  // ============ VALIDATION METHODS ============
  async validateAdminCredentials(
    username: string,
    password: string,
  ): Promise<PrismaAdmin | null> {
    const admin = await this.prisma.admin.findUnique({
      where: { username },
    });

    if (!admin || !admin.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return null;
    }

    return admin;
  }

  async validateRefreshToken(token: string): Promise<RefreshToken> {
    const refreshToken = await this.prisma.refreshToken.findFirst({
      where: {
        token,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return refreshToken;
  }

  // ============ AUTHENTICATION METHODS ============
  async login(loginDto: LoginAdminDto) {
    const admin = await this.prisma.admin.findUnique({
      where: { username: loginDto.username },
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      admin.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const updatedAdmin = await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date(), updatedAt: new Date() },
    });

    const tokens = await this.generateTokens(updatedAdmin);

    return {
      success: true,
      message: 'Login successful',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 3600,
        admin: {
          id: updatedAdmin.id,
          username: updatedAdmin.username,
          displayName: updatedAdmin.displayName,
          role: this.toApiRole(updatedAdmin.role),
        },
      },
    };
  }

  private async generateTokens(admin: PrismaAdmin): Promise<TokenPair> {
    const accessTokenPayload = {
      sub: admin.id,
      username: admin.username,
      role: this.toApiRole(admin.role),
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      expiresIn: '1h',
    });

    const refreshToken = this.generateRefreshToken();

    await this.prisma.refreshToken.create({
      data: {
        id: createObjectIdString(),
        token: refreshToken,
        adminId: admin.id,
        expiresAt: this.getRefreshTokenExpiry(),
        isRevoked: false,
      },
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponseDto> {
    const refreshToken = await this.validateRefreshToken(
      refreshTokenDto.refreshToken,
    );

    const admin = await this.prisma.admin.findUnique({
      where: { id: refreshToken.adminId },
    });
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Admin account is inactive');
    }

    const accessToken = this.generateAccessToken(admin);
    const newRefreshToken = this.generateRefreshToken();
    const expiresAt = this.getRefreshTokenExpiry();

    await this.prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: {
        token: newRefreshToken,
        expiresAt,
        updatedAt: new Date(),
      },
    });

    return new TokenResponseDto(
      accessToken,
      newRefreshToken,
      3600,
      this.toSafeAdminResponse(admin),
    );
  }

  // ============ LOGOUT METHODS ============
  async logout(refreshTokenDto: RefreshTokenDto): Promise<{ message: string }> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { token: refreshTokenDto.refreshToken },
      data: { isRevoked: true, updatedAt: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException('Refresh token not found');
    }

    return { message: 'Successfully logged out' };
  }

  async logoutAll(adminId: string): Promise<{ message: string }> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    await this.prisma.refreshToken.updateMany({
      where: { adminId, isRevoked: false },
      data: { isRevoked: true, updatedAt: new Date() },
    });

    return { message: 'Logged out from all devices' };
  }

  // ============ PASSWORD MANAGEMENT ============
  async changePassword(
    adminId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      admin.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const isSamePassword = await bcrypt.compare(
      changePasswordDto.newPassword,
      admin.password,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password cannot be the same as current password',
      );
    }

    await this.prisma.admin.update({
      where: { id: adminId },
      data: {
        password: await this.hashPassword(changePasswordDto.newPassword),
        updatedAt: new Date(),
      },
    });

    await this.logoutAll(adminId);

    return { message: 'Password changed successfully. Please login again.' };
  }

  async resetPassword(
    adminId: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    await this.prisma.admin.update({
      where: { id: adminId },
      data: {
        password: await this.hashPassword(newPassword),
        updatedAt: new Date(),
      },
    });

    await this.logoutAll(adminId);

    return { message: 'Password reset successfully. Please login again.' };
  }

  // ============ TOKEN MANAGEMENT ============
  async getAdminTokens(adminId: string): Promise<RefreshTokenResponse[]> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const tokens = await this.prisma.refreshToken.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
    });

    return tokens.map((token) => this.toRefreshTokenResponse(token));
  }

  async revokeTokenById(tokenId: string): Promise<RefreshTokenResponse> {
    const token = await this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
    });

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    const updatedToken = await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { isRevoked: true, updatedAt: new Date() },
    });

    return this.toRefreshTokenResponse(updatedToken);
  }

  async revokeTokenByValue(token: string): Promise<RefreshTokenResponse> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!refreshToken) {
      throw new NotFoundException('Token not found');
    }

    const updatedToken = await this.prisma.refreshToken.update({
      where: { token },
      data: { isRevoked: true, updatedAt: new Date() },
    });

    return this.toRefreshTokenResponse(updatedToken);
  }

  // ============ ADMIN MANAGEMENT ============
  async getAdminProfile(adminId: string): Promise<SafeAdminResponse> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return this.toSafeAdminResponse(admin);
  }

  async updateAdminProfile(
    adminId: string,
    updateData: AdminProfileUpdateData,
  ): Promise<SafeAdminResponse> {
    const data = await this.buildAdminProfileUpdateData(adminId, updateData);

    const admin = await this.prisma.admin.update({
      where: { id: adminId },
      data,
    }).catch(() => null);

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return this.toSafeAdminResponse(admin);
  }

  private async buildAdminProfileUpdateData(
    adminId: string,
    updateData: AdminProfileUpdateData,
  ) {
    if (updateData.username !== undefined) {
      const existingAdmin = await this.prisma.admin.findFirst({
        where: {
          username: updateData.username,
          NOT: { id: adminId },
        },
      });

      if (existingAdmin) {
        throw new BadRequestException('Username already taken');
      }
    }

    const data: {
      username?: string;
      password?: string;
      displayName?: string;
      isActive?: boolean;
      lastLogin?: Date;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (updateData.username !== undefined) {
      data.username = updateData.username;
    }
    if (updateData.displayName !== undefined) {
      data.displayName = updateData.displayName;
    }
    if (updateData.isActive !== undefined) {
      data.isActive = updateData.isActive;
    }
    if (updateData.lastLogin !== undefined) {
      data.lastLogin = updateData.lastLogin;
    }
    if (updateData.password !== undefined) {
      data.password = await this.hashPassword(updateData.password);
    }

    return data;
  }

  // ============ SECURITY METHODS ============
  async cleanupExpiredTokens(): Promise<{
    deletedCount: number;
    message: string;
  }> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            isRevoked: true,
            updatedAt: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
    });

    return {
      deletedCount: result.count,
      message: `Cleaned up ${result.count} expired/revoked tokens`,
    };
  }

  async getTokenStatistics(): Promise<{
    total: number;
    active: number;
    revoked: number;
    expired: number;
  }> {
    const [total, active, revoked, expired] = await Promise.all([
      this.prisma.refreshToken.count(),
      this.prisma.refreshToken.count({
        where: {
          isRevoked: false,
          expiresAt: { gt: new Date() },
        },
      }),
      this.prisma.refreshToken.count({ where: { isRevoked: true } }),
      this.prisma.refreshToken.count({
        where: {
          expiresAt: { lt: new Date() },
          isRevoked: false,
        },
      }),
    ]);

    return { total, active, revoked, expired };
  }

  // ============ VALIDATION HELPERS ============
  async validateAccessToken(token: string): Promise<JwtTokenPayload> {
    try {
      return this.jwtService.verify<JwtTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  async isTokenRevoked(token: string): Promise<boolean> {
    const refreshToken = await this.prisma.refreshToken.findUnique({
      where: { token },
    });
    return refreshToken ? refreshToken.isRevoked : true;
  }

  // ============ ADMIN STATUS METHODS ============
  async checkAdminStatus(adminId: string): Promise<{
    isActive: boolean;
    lastLogin: Date | null;
    hasActiveTokens: boolean;
  }> {
    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
    });
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const activeTokens = await this.prisma.refreshToken.count({
      where: {
        adminId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    return {
      isActive: admin.isActive,
      lastLogin: admin.lastLogin,
      hasActiveTokens: activeTokens > 0,
    };
  }

  // ============ BULK OPERATIONS ============
  async revokeAllTokens(): Promise<{ revokedCount: number; message: string }> {
    const result = await this.prisma.refreshToken.updateMany({
      where: { isRevoked: false },
      data: { isRevoked: true, updatedAt: new Date() },
    });

    return {
      revokedCount: result.count,
      message: `Revoked ${result.count} tokens`,
    };
  }

  async cleanupAllInactiveAdminTokens(): Promise<{
    cleanedCount: number;
    message: string;
  }> {
    const inactiveAdmins = await this.prisma.admin.findMany({
      where: { isActive: false },
      select: { id: true },
    });

    const adminIds = inactiveAdmins.map((admin) => admin.id);

    if (adminIds.length === 0) {
      return { cleanedCount: 0, message: 'No inactive admins found' };
    }

    const result = await this.prisma.refreshToken.updateMany({
      where: { adminId: { in: adminIds } },
      data: { isRevoked: true, updatedAt: new Date() },
    });

    return {
      cleanedCount: result.count,
      message: `Revoked ${result.count} tokens from inactive admins`,
    };
  }
}

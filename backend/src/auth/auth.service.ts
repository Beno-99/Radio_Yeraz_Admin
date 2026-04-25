// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { Admin, AdminDocument, Role } from '../admin/schemas/admin.schema';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema';
import { LoginAdminDto } from '../admin/dto/login-admin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { TokenResponseDto } from './dto/token-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Admin.name) private adminModel: Model<AdminDocument>,
    @InjectModel(RefreshToken.name)
    private refreshTokenModel: Model<RefreshTokenDocument>,
    private jwtService: JwtService,
  ) {}

  // ============ TOKEN GENERATION METHODS ============
  private generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  private async generateAccessToken(admin: AdminDocument): Promise<string> {
    return this.jwtService.sign(
      {
        sub: admin._id,
        username: admin.username,
        role: admin.role,
      },
      {
        expiresIn: '1h',
      },
    );
  }

  private getRefreshTokenExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    return expiresAt;
  }

  // ============ VALIDATION METHODS ============
  async validateAdminCredentials(
    username: string,
    password: string,
  ): Promise<AdminDocument | null> {
    const admin = await this.adminModel
      .findOne({ username })
      .select('+password');

    if (!admin || !admin.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return null;
    }

    return admin;
  }

  async validateRefreshToken(token: string): Promise<RefreshTokenDocument> {
    const refreshToken = await this.refreshTokenModel.findOne({
      token,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    return refreshToken;
  }

  // ============ AUTHENTICATION METHODS ============
  async login(loginDto: LoginAdminDto) {
    // 1. Find admin by username
    const admin = await this.adminModel
      .findOne({ username: loginDto.username })
      .select('+password')
      .exec();

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Check if admin is active
    if (!admin.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    // 3. Verify password
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      admin.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 4. Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // 5. Generate tokens
    const tokens = await this.generateTokens(admin);

    return {
      success: true,
      message: 'Login successful',
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 3600, // 1 hour in seconds
        admin: {
          id: admin._id,
          username: admin.username,
          displayName: admin.displayName,
          role: admin.role,
        },
      },
    };
  }

  private async generateTokens(admin: AdminDocument) {
    // ✅ admin._id is available here
    const accessTokenPayload = {
      sub: admin._id.toString(),
      username: admin.username,
      role: admin.role,
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(
      { sub: admin._id.toString(), type: 'refresh' },
      { expiresIn: '7d' },
    );

    // Save refresh token
    await this.refreshTokenModel.create({
      token: refreshToken,
      admin: admin._id, // ✅ Can use directly as ObjectId
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isRevoked: false,
    });

    return { accessToken, refreshToken };
  }

  async refreshToken(
    refreshTokenDto: RefreshTokenDto,
  ): Promise<TokenResponseDto> {
    // Validate refresh token
    const refreshToken = await this.validateRefreshToken(
      refreshTokenDto.refreshToken,
    );

    // Get admin
    const admin = await this.adminModel.findById(refreshToken.admin);
    if (!admin) {
      throw new UnauthorizedException('Admin not found');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException('Admin account is inactive');
    }

    // Generate new tokens
    const accessToken = await this.generateAccessToken(admin);
    const newRefreshToken = this.generateRefreshToken();
    const expiresAt = this.getRefreshTokenExpiry();

    // Update refresh token (token rotation)
    refreshToken.token = newRefreshToken;
    refreshToken.expiresAt = expiresAt;
    await refreshToken.save();

    // Remove password from admin object
    const adminWithoutPassword = admin.toObject();
    delete adminWithoutPassword.password;

    return new TokenResponseDto(
      accessToken,
      newRefreshToken,
      3600,
      adminWithoutPassword,
    );
  }

  // ============ LOGOUT METHODS ============
  async logout(refreshTokenDto: RefreshTokenDto): Promise<{ message: string }> {
    const result = await this.refreshTokenModel.updateOne(
      { token: refreshTokenDto.refreshToken },
      { isRevoked: true, updatedAt: new Date() },
    );

    if (result.modifiedCount === 0) {
      throw new NotFoundException('Refresh token not found');
    }

    return { message: 'Successfully logged out' };
  }

  async logoutAll(adminId: string): Promise<{ message: string }> {
    // Validate admin exists
    const admin = await this.adminModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    await this.refreshTokenModel.updateMany(
      { admin: adminId, isRevoked: false },
      { isRevoked: true, updatedAt: new Date() },
    );

    return { message: 'Logged out from all devices' };
  }

  // ============ PASSWORD MANAGEMENT ============
  async changePassword(
    adminId: string,
    changePasswordDto: ChangePasswordDto, // Just the DTO
  ): Promise<{ message: string }> {
    // Use changePasswordDto.currentPassword and changePasswordDto.newPassword
    const admin = await this.adminModel.findById(adminId).select('+password');

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Validate current password
    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword, // Access from DTO
      admin.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is same as old
    const isSamePassword = await bcrypt.compare(
      changePasswordDto.newPassword, // Access from DTO
      admin.password,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password cannot be the same as current password',
      );
    }

    // Update password
    admin.password = changePasswordDto.newPassword; // Access from DTO
    admin.updatedAt = new Date();
    await admin.save();

    // Revoke all tokens for security
    await this.logoutAll(adminId);

    return { message: 'Password changed successfully. Please login again.' };
  }

  async resetPassword(
    adminId: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const admin = await this.adminModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    admin.password = newPassword;
    admin.updatedAt = new Date();
    await admin.save();

    // Revoke all tokens
    await this.logoutAll(adminId);

    return { message: 'Password reset successfully. Please login again.' };
  }

  // ============ TOKEN MANAGEMENT ============
  async getAdminTokens(adminId: string): Promise<RefreshTokenDocument[]> {
    // Validate admin exists
    const admin = await this.adminModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    return this.refreshTokenModel
      .find({ admin: adminId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async revokeTokenById(tokenId: string): Promise<RefreshTokenDocument> {
    const token = await this.refreshTokenModel.findByIdAndUpdate(
      tokenId,
      { isRevoked: true, updatedAt: new Date() },
      { new: true },
    );

    if (!token) {
      throw new NotFoundException('Token not found');
    }

    return token;
  }

  async revokeTokenByValue(token: string): Promise<RefreshTokenDocument> {
    const refreshToken = await this.refreshTokenModel.findOneAndUpdate(
      { token },
      { isRevoked: true, updatedAt: new Date() },
      { new: true },
    );

    if (!refreshToken) {
      throw new NotFoundException('Token not found');
    }

    return refreshToken;
  }

  // ============ ADMIN MANAGEMENT ============
  async getAdminProfile(adminId: string): Promise<AdminDocument> {
    const admin = await this.adminModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Remove password
    const adminWithoutPassword = admin.toObject();
    delete adminWithoutPassword.password;

    return adminWithoutPassword as AdminDocument;
  }

  async updateAdminProfile(
    adminId: string,
    updateData: Partial<Admin>,
  ): Promise<AdminDocument> {
    // Don't allow role update through profile (use admin service instead)
    if (updateData.role) {
      delete updateData.role;
    }

    const admin = await this.adminModel.findByIdAndUpdate(
      adminId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true },
    );

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    // Remove password
    const adminWithoutPassword = admin.toObject();
    delete adminWithoutPassword.password;

    return adminWithoutPassword as AdminDocument;
  }

  // ============ SECURITY METHODS ============
  async cleanupExpiredTokens(): Promise<{
    deletedCount: number;
    message: string;
  }> {
    const result = await this.refreshTokenModel.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        {
          isRevoked: true,
          updatedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }, // Delete revoked tokens older than 30 days
      ],
    });

    return {
      deletedCount: result.deletedCount,
      message: `Cleaned up ${result.deletedCount} expired/revoked tokens`,
    };
  }

  async getTokenStatistics(): Promise<{
    total: number;
    active: number;
    revoked: number;
    expired: number;
  }> {
    const [total, active, revoked, expired] = await Promise.all([
      this.refreshTokenModel.countDocuments(),
      this.refreshTokenModel.countDocuments({
        isRevoked: false,
        expiresAt: { $gt: new Date() },
      }),
      this.refreshTokenModel.countDocuments({ isRevoked: true }),
      this.refreshTokenModel.countDocuments({
        expiresAt: { $lt: new Date() },
        isRevoked: false,
      }),
    ]);

    return { total, active, revoked, expired };
  }

  // ============ VALIDATION HELPERS ============
  async validateAccessToken(token: string): Promise<any> {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  async isTokenRevoked(token: string): Promise<boolean> {
    const refreshToken = await this.refreshTokenModel.findOne({ token });
    return refreshToken ? refreshToken.isRevoked : true;
  }

  // ============ ADMIN STATUS METHODS ============
  async checkAdminStatus(adminId: string): Promise<{
    isActive: boolean;
    lastLogin: Date;
    hasActiveTokens: boolean;
  }> {
    const admin = await this.adminModel.findById(adminId);
    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    const activeTokens = await this.refreshTokenModel.countDocuments({
      admin: adminId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });

    return {
      isActive: admin.isActive,
      lastLogin: admin.lastLogin,
      hasActiveTokens: activeTokens > 0,
    };
  }

  // ============ BULK OPERATIONS ============
  async revokeAllTokens(): Promise<{ revokedCount: number; message: string }> {
    const result = await this.refreshTokenModel.updateMany(
      { isRevoked: false },
      { isRevoked: true, updatedAt: new Date() },
    );

    return {
      revokedCount: result.modifiedCount,
      message: `Revoked ${result.modifiedCount} tokens`,
    };
  }

  async cleanupAllInactiveAdminTokens(): Promise<{
    cleanedCount: number;
    message: string;
  }> {
    // Find inactive admins
    const inactiveAdmins = await this.adminModel
      .find({ isActive: false })
      .select('_id');

    const adminIds = inactiveAdmins.map((admin) => admin._id);

    if (adminIds.length === 0) {
      return { cleanedCount: 0, message: 'No inactive admins found' };
    }

    // Revoke all tokens for inactive admins
    const result = await this.refreshTokenModel.updateMany(
      { admin: { $in: adminIds } },
      { isRevoked: true, updatedAt: new Date() },
    );

    return {
      cleanedCount: result.modifiedCount,
      message: `Revoked ${result.modifiedCount} tokens from inactive admins`,
    };
  }
}

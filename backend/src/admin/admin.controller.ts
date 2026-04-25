// src/admin/admin.controller.ts
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
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from './schemas/admin.schema';
import { Request } from 'express';
import mongoose from 'mongoose';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ============ AUTH ENDPOINTS ============
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginAdminDto) {
    const admin = await this.adminService.validateAdmin(
      loginDto.username,
      loginDto.password,
    );

    if (!admin) {
      throw new UnauthorizedException('Username or password is wrong');
    }

    if (!admin.isActive) {
      throw new UnauthorizedException(
        'Your account is inactive. Please contact administrator.',
      );
    }

    return {
      success: true,
      message: 'Login successful',
      data: admin,
    };
  }

  // ============ PROTECTED ENDPOINTS ============
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: Request) {
    const adminId = req.user['sub'];
    const admin = await this.adminService.findById(adminId);
    return { success: true, data: admin };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @Req() req: Request,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    const adminId = req.user['sub'];
    const updaterName =
      req.user['displayName'] || req.user['username'] || 'Admin';
    const admin = await this.adminService.updateAdmin(
      adminId,
      updateAdminDto,
      updaterName,
    );
    return {
      success: true,
      message: 'Profile updated successfully',
      data: admin,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req: Request,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const adminId = req.user['sub'];
    await this.adminService.changePassword(
      adminId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    return { success: true, message: 'Password changed successfully' };
  }

  // ============ SUPER ADMIN ONLY ENDPOINTS ============
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async createAdmin(
    @Req() req: Request,
    @Body() createAdminDto: CreateAdminDto,
  ) {
    const creatorId = req.user['sub'];
    const admin = await this.adminService.createAdmin(
      creatorId,
      createAdminDto,
    );
    return {
      success: true,
      message: 'Admin created successfully',
      data: admin,
    };
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async getAllAdmins(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string,
    @Query('role') role: Role,
    @Query('active') active: string,
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;

    const filters: any = {};
    if (role) filters.role = role;
    if (active !== undefined) filters.isActive = active === 'true';

    const result = await this.adminService.findAll(
      pageNum,
      limitNum,
      search,
      filters,
    );
    return { success: true, ...result };
  }

  @Get(':id')
  async getAdmin(@Param('id') id: string) {
    if (!id || id === 'undefined' || !mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    return this.adminService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async updateAdmin(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    const updaterName =
      req.user['displayName'] || req.user['username'] || 'Admin'; // ← GET name
    const admin = await this.adminService.updateAdmin(
      id,
      updateAdminDto,
      updaterName,
    );
    return {
      success: true,
      message: 'Admin updated successfully',
      data: admin,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async deleteAdmin(@Req() req: Request, @Param('id') id: string) {
    const deleterName =
      req.user['displayName'] || req.user['username'] || 'Admin'; // ← GET name
    await this.adminService.deleteAdmin(id, deleterName);
    return { success: true, message: 'Admin deleted successfully' };
  }

  @Put(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async toggleActiveStatus(@Req() req: Request, @Param('id') id: string) {
    const togglerName =
      req.user['displayName'] || req.user['username'] || 'Admin'; // ← GET name
    const admin = await this.adminService.toggleActiveStatus(id, togglerName);
    return {
      success: true,
      message: `Admin ${admin.isActive ? 'activated' : 'deactivated'} successfully`,
      data: admin,
    };
  }

  @Get('statistics/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async getStatistics() {
    const statistics = await this.adminService.getStatistics();
    return { success: true, data: statistics };
  }

  @Get('check-username/:username')
  async checkUsernameAvailability(@Param('username') username: string) {
    const exists = await this.adminService.findByUsername(username);
    return { success: true, available: !exists };
  }
}

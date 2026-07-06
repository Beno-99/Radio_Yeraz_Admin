// src/admin/admin.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { isObjectIdString } from '../common/utils/object-id.utils';
import { AdminService } from './admin.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { LoginAdminDto } from './dto/login-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { UpdateAdminProfileDto } from './dto/update-admin-profile.dto';
import { Role } from './schemas/admin.schema';

interface AdminControllerFilters {
  role?: Role;
  isActive?: boolean;
}

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: AuthenticatedRequest) {
    const admin = await this.adminService.findById(req.user.sub);
    return { success: true, data: admin };
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateAdminProfileDto,
  ) {
    const updaterName = req.user.displayName || req.user.username || 'Admin';
    const admin = await this.adminService.updateOwnProfile(
      req.user.sub,
      updateProfileDto,
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
    @Req() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.adminService.changePassword(
      req.user.sub,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );
    return { success: true, message: 'Password changed successfully' };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async createAdmin(
    @Req() req: AuthenticatedRequest,
    @Body() createAdminDto: CreateAdminDto,
  ) {
    const admin = await this.adminService.createAdmin(
      req.user.sub,
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

    const filters: AdminControllerFilters = {};
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async getAdmin(@Param('id') id: string) {
    if (!id || id === 'undefined' || !isObjectIdString(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    return this.adminService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async updateAdmin(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() updateAdminDto: UpdateAdminDto,
  ) {
    const updaterName = req.user.displayName || req.user.username || 'Admin';
    const admin = await this.adminService.updateAdmin(
      id,
      updateAdminDto,
      updaterName,
      req.user.sub,
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
  async deleteAdmin(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const deleterName = req.user.displayName || req.user.username || 'Admin';
    await this.adminService.deleteAdmin(id, deleterName, req.user.sub);
    return { success: true, message: 'Admin deleted successfully' };
  }

  @Put(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async toggleActiveStatus(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const togglerName = req.user.displayName || req.user.username || 'Admin';
    const admin = await this.adminService.toggleActiveStatus(
      id,
      togglerName,
      req.user.sub,
    );
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

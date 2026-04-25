// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAdminDto } from '../admin/dto/login-admin.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../admin/schemas/admin.schema';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginAdminDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    // Verify refresh token and issue new access token
    const tokens = await this.authService.refreshToken(refreshTokenDto);
    return tokens;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.logout(refreshTokenDto);
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(@Req() req: any) {
    const adminId = req.user.sub;
    return this.authService.logoutAll(adminId);
  }

  @Get('tokens')
  @UseGuards(JwtAuthGuard)
  async getMyTokens(@Req() req: any) {
    const adminId = req.user.sub;
    const tokens = await this.authService.getAdminTokens(adminId);
    return {
      success: true,
      data: tokens,
    };
  }

  @Delete('tokens/:tokenId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  async revokeToken(@Param('tokenId') tokenId: string) {
    const token = await this.authService.revokeTokenById(tokenId);
    return {
      success: true,
      message: 'Token revoked successfully',
      data: token,
    };
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Req() req: any,
    @Body() changePasswordDto: ChangePasswordDto, // Get the full DTO
  ) {
    const adminId = req.user.sub;
    // Pass the full DTO object
    return this.authService.changePassword(adminId, changePasswordDto);
  }
}

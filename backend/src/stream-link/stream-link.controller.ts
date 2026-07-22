import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { StreamLinkService } from './stream-link.service';
import { CreateStreamLinkDto } from './dto/create-stream-link.dto';
import { UpdateStreamLinkDto } from './dto/update-stream-link.dto';

// Guards
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AdminActiveGuard } from '../auth/guards/admin-active.guard';

// Decorators
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../admin/schemas/admin.schema';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';

@Controller('stream-links')
export class StreamLinkController {
  constructor(private readonly streamLinkService: StreamLinkService) {}

  // ====================== PUBLIC ROUTES (No Auth Required) ======================
  @Get()
  findAll() {
    return this.streamLinkService.findAll();
  }

  @Get('active')
  findActive() {
    return this.streamLinkService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.streamLinkService.findOne(id);
  }

  // ====================== PROTECTED ROUTES (Admin Only) ======================
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, AdminActiveGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateStreamLinkDto) {
    return this.streamLinkService.create(dto, req.user.sub);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, AdminActiveGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateStreamLinkDto,
  ) {
    const editPermission = await this.streamLinkService.canAdminEditStreamLink(
      id,
      req.user.sub,
      req.user.role,
    );
    if (!editPermission.allowed) {
      throw new ForbiddenException(
        editPermission.message || "You can't edit this stream link.",
      );
    }

    return this.streamLinkService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, AdminActiveGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const deletePermission =
      await this.streamLinkService.canAdminDeleteStreamLink(
        id,
        req.user.sub,
        req.user.role,
      );
    if (!deletePermission.allowed) {
      throw new ForbiddenException(
        deletePermission.message || "You can't delete this stream link.",
      );
    }

    return this.streamLinkService.remove(id);
  }
}

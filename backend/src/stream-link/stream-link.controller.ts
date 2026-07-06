import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
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
  create(@Body() dto: CreateStreamLinkDto) {
    return this.streamLinkService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, AdminActiveGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateStreamLinkDto) {
    return this.streamLinkService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, AdminActiveGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.streamLinkService.remove(id);
  }
}
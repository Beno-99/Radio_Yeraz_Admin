// src/admin/dto/update-admin-profile.dto.ts
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateAdminProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  username?: string;

  @IsOptional()
  @IsString()
  displayName?: string;
}

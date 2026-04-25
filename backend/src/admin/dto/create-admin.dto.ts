// src/admin/dto/create-admin.dto.ts
import {
  IsString,
  IsOptional,
  IsEnum,
  MinLength,
  IsBoolean,
} from 'class-validator';
import { Role } from '../schemas/admin.schema';

export class CreateAdminDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

// src/auth/dto/create-refresh-token.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsBoolean,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  adminId: string; // MongoDB ObjectId as string

  @IsDate()
  @Type(() => Date) // Transform string to Date
  expiresAt: Date;

  @IsBoolean()
  @IsOptional()
  isRevoked?: boolean = false;
}

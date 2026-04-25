// src/ads/dto/create-ad.dto.ts
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsUrl,
} from 'class-validator';

export class CreateAdDto {
  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  targetUrl?: string;

  @IsString()
  name: string;
}

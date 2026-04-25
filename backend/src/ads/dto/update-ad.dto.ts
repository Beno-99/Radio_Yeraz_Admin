// src/ads/dto/update-ad.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateAdDto } from './create-ad.dto';
import {
  IsOptional,
  IsBoolean,
  IsString,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateAdDto extends PartialType(CreateAdDto) {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  targetUrl?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  image?: string;
}

// src/carousels/dto/update-carousel.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateCarouselDto } from './create-carousel.dto';
import {
  IsOptional,
  IsBoolean,
  IsString,
  IsDateString,
  IsUrl,
} from 'class-validator';
import { Transform } from 'class-transformer';

const optionalEmptyToNull = ({ value }: { value: unknown }) =>
  value === '' ? null : value;

export class UpdateCarouselDto extends PartialType(CreateCarouselDto) {
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
  @Transform(optionalEmptyToNull)
  @IsString()
  @IsUrl()
  targetUrl?: string | null;

  @IsOptional()
  @Transform(optionalEmptyToNull)
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @Transform(optionalEmptyToNull)
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  removeImage?: string;
}

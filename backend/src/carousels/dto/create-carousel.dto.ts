// src/carousels/dto/create-carousel.dto.ts
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsUrl,
  IsInt,
} from 'class-validator';
import { Transform } from 'class-transformer';

const optionalEmptyToNull = ({ value }: { value: unknown }) =>
  value === '' ? null : value;

export class CreateCarouselDto {
  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean = true;

  @IsOptional()
  @Transform(optionalEmptyToNull)
  @IsDateString()
  startDate?: string | null;

  @IsOptional()
  @Transform(optionalEmptyToNull)
  @IsDateString()
  endDate?: string | null;

  @IsOptional()
  @Transform(optionalEmptyToNull)
  @IsString()
  @IsUrl()
  targetUrl?: string | null;

  @IsString()
  name: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return Number.parseInt(String(value), 10);
  })
  @IsInt()
  displayOrder?: number;
}

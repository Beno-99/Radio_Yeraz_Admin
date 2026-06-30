import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDate,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePostDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  youtubeUrl?: string;

  @IsOptional()
  @IsString()
  facebookUrl?: string;

  @IsOptional()
  @IsString()
  profileName?: string = 'Radio Yeraz';

  @IsOptional()
  @IsString()
  eventDate?: string;

  @IsOptional()
  @IsString()
  eventTime?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  mainImage?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'false') return false;
    if (value === 'true') return true;
    if (value === false) return false;
    if (value === true) return true;
    return false;
  })
  isLive?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'false' || value === false) return false;
    if (value === 'true' || value === true) return true;
    return false;
  })
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'false' || value === false) return false;
    if (value === 'true' || value === true) return true;
    return undefined;
  })
  @IsBoolean()
  autoExpire?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) {
      return undefined;
    }
    return Number(value);
  })
  @IsInt()
  @Min(1)
  @Max(365)
  expireAfterDays?: number;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  status?: 'draft' | 'published' | 'expired';

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return undefined;
    return new Date(value);
  })
  @IsDate()
  expiresAt?: Date;
}

import { IsString, IsOptional, IsBoolean, IsDate } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePostDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  video?: string;

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
  mainImage?: string; // <-- Add this for updates

  @IsOptional()
  @Transform(({ value }) => {
    // Explicit string checks
    if (value === 'false') return false;
    if (value === 'true') return true;
    if (value === false) return false;
    if (value === true) return true;
    return false; // default
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
  @IsString()
  link?: string;

  // NO mainImage here - it will be added by controller
}

// src/posts/dto/update-post.dto.ts
import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdatePostDto {
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
  location?: string;

  @IsOptional()
  @IsString()
  mainImage?: string; // <-- Add this for updates

  @IsOptional()
  @Transform(({ value }) => {
    console.log('=== DTO TRANSFORM isLive ===');
    console.log('Input value:', value, 'type:', typeof value);

    if (value === 'true' || value === true) {
      console.log('Returning true');
      return true;
    }
    if (value === 'false' || value === false) {
      console.log('Returning false');
      return false;
    }
    console.log('Returning undefined');
    return undefined;
  })
  @IsBoolean()
  isLive?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    console.log('=== DTO TRANSFORM isPublished ===');
    console.log('Input value:', value, 'type:', typeof value);

    if (value === 'true' || value === true) {
      console.log('Returning true');
      return true;
    }
    if (value === 'false' || value === false) {
      console.log('Returning false');
      return false;
    }
    console.log('Returning undefined');
    return undefined;
  })
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  removeImage?: string;

  @IsOptional()
  removeVideo?: string;

  @IsOptional()
  expiresAt?: Date;
}

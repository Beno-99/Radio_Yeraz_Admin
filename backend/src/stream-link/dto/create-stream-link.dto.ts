import { Transform } from 'class-transformer';
import {
  IsString,
  IsUrl,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';

const optionalInteger = ({ value }: { value: unknown }) => {
  if (value === undefined || value === '') return undefined;
  if (value === null) return null;
  return Number.parseInt(String(value), 10);
};

export class CreateStreamLinkDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsUrl({ require_protocol: true, require_tld: false })
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @Transform(optionalInteger)
  @IsInt()
  @Min(1)
  @Max(512)
  bitrate?: number | null;

  @IsOptional()
  @Transform(optionalInteger)
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

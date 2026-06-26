import { IsString, IsUrl, IsBoolean, IsOptional, MinLength, MaxLength } from 'class-validator';

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
  @IsBoolean()
  isActive?: boolean = true;
}

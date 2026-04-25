// src/admin/dto/login-admin.dto.ts
import { IsString, MinLength } from 'class-validator';

export class LoginAdminDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}

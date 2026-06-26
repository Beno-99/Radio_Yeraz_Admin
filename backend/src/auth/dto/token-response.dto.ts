// src/auth/dto/token-response.dto.ts
import { Role } from '../../admin/schemas/admin.schema';

export interface TokenResponseAdmin {
  _id: string;
  username: string;
  displayName: string;
  role: Role | string;
}

export class TokenResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
  admin: {
    id: string;
    username: string;
    displayName: string;
    role: string;
  };

  constructor(
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    admin: TokenResponseAdmin,
  ) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.expiresIn = expiresIn;
    this.tokenType = 'Bearer';
    this.admin = {
      id: admin._id,
      username: admin.username,
      displayName: admin.displayName,
      role: admin.role,
    };
  }
}

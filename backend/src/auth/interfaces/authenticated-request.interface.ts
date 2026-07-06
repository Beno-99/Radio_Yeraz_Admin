import { Request } from 'express';
import { Role } from '../../admin/schemas/admin.schema';

export interface AuthenticatedUser {
  sub: string;
  username: string;
  role: Role;
  displayName?: string;
  isActive?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

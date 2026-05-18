import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Role } from '../../admin/schemas/admin.schema';   // Import Role enum

@Injectable()
export class AdminActiveGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Allow both ADMIN and SUPER_ADMIN using the enum
    if (![Role.ADMIN, Role.SUPER_ADMIN].includes(user.role)) {
      throw new ForbiddenException('Admin access required');
    }

    if (user.isActive === false) {
      throw new ForbiddenException(
        'Your admin account is deactivated. Please contact super admin.',
      );
    }

    return true;
  }
}
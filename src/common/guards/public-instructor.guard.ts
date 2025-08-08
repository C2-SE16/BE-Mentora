// src/auth/guards/public-instructor-or-owner.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserService } from '../../common/services/user.service';
import { role_enum } from '@prisma/client';

@Injectable()
export class PublicInstructorGuard implements CanActivate {
  constructor(private userService: UserService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const params = request.params;

    const targetUser = await this.userService.getUserById(params.id);

    if (targetUser.role === role_enum.INSTRUCTOR) {
      return true;
    }

    const user = request.user;

    if (!user) {
      throw new ForbiddenException(
        'Authentication required to view this profile',
      );
    }

    if (user.userId !== params.id) {
      throw new ForbiddenException('You can only view your own profile');
    }

    return true;
  }
}

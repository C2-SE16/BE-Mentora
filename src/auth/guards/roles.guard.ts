import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { RoleCheckService } from 'src/common/services/role-check.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private roleCheckService: RoleCheckService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.role) {
      return false;
    }

    if (requiredRoles.includes(user.role)) {
      return true;
    }

    // Nếu role là INSTRUCTOR và user chưa có quyền này
    if (requiredRoles.includes('INSTRUCTOR')) {
      if (user.role === 'INSTRUCTOR') {
        return true;
      }

      // Kiểm tra DB nếu token không có role INSTRUCTOR
      const isInstructor = await this.roleCheckService.isInstructor(
        user.userId || user.sub,
      );
      if (isInstructor) {
        const instructorId = await this.roleCheckService.getInstructorId(
          user.userId || user.sub,
        );
        request.user.instructorId = instructorId;
        return true;
      }

      // Không phải instructor
      return false;
    }

    // Với các role khác, kiểm tra đơn giản
    return requiredRoles.includes(user.role);
  }
}

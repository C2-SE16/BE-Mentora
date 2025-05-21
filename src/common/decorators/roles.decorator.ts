import { SetMetadata } from '@nestjs/common';
import { role_enum } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: role_enum[]) => SetMetadata(ROLES_KEY, roles);

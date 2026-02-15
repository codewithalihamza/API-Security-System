import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';

/**
 * Specifies which roles can access the route
 * Use with RolesGuard - if no @Roles() decorator, route is accessible to any authenticated user
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

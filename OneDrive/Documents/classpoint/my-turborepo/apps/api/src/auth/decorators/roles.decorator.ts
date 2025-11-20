import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../dto/register.dto';

/**
 * Roles decorator
 * Specify which roles are allowed to access a route
 *
 * Usage:
 * @Roles(UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN)
 * @Get('admin-only')
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

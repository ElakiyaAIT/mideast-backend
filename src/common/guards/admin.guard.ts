import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { RoleCacheService } from '../../modules/role/role-cache.service';

/**
 * AdminGuard - Ensures only admin users can access the route
 *
 * This guard checks if the user's roleId matches the admin roleId.
 * It uses RoleCacheService to get the admin roleId at runtime.
 *
 * @example
 * // In controller
 * @UseGuards(JwtAuthGuard, AdminGuard)
 * @Get('admin-only')
 * adminOnlyRoute() {
 *   return { message: 'Admin only' };
 * }
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly roleCacheService: RoleCacheService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    // User must be authenticated and have a roleId
    if (!user || !(user as { roleId?: string }).roleId) {
      return false;
    }

    // Get user's roleId
    const userRoleId = (user as { roleId?: string }).roleId?.toString();

    // Check if user is admin
    return this.roleCacheService.isAdmin(userRoleId || '');
  }
}

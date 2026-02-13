import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard - Guards routes based on user roleIds
 *
 * This guard checks if the user's roleId matches any of the allowed roleIds
 * specified in the @Roles() decorator.
 *
 * IMPORTANT: This guard works with roleIds (MongoDB ObjectId strings), not role names.
 * Make sure to use roleIds when applying the @Roles() decorator.
 * @example
 * // In controller
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('65a1234567890abcdef12345') // Admin roleId
 * @Get('admin-only')
 * adminOnlyRoute() {
 *   return { message: 'Admin only' };
 * }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoleIds = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roleIds are specified, allow access
    if (!requiredRoleIds || requiredRoleIds.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;

    // User must be authenticated and have a roleId
    if (!user || !(user as { roleId?: string }).roleId) {
      return false;
    }

    // Convert user's roleId to string for comparison
    const userRoleId =
      user && (user as { roleId?: string }).roleId
        ? (user as { roleId?: string }).roleId?.toString()
        : '';

    // Check if user's roleId is in the list of allowed roleIds
    return requiredRoleIds.includes(userRoleId as string);
  }
}

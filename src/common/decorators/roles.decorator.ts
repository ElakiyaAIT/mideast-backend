import { CustomDecorator, SetMetadata } from '@nestjs/common';

/**
 * Roles Decorator
 * Used to specify which roleIds are allowed to access a route
 *
 * IMPORTANT: This decorator accepts roleIds (MongoDB ObjectId strings), not role names.
 * You must fetch roleIds from the database or cache them at application startup.
 * @param roleIds - Array of roleIds (strings) that are allowed to access the route
 * @example
 * // In your controller, inject RoleService to get roleIds
 * constructor(private roleService: RoleService) {}
 * async someMethod() {
 *   const adminRole = await this.roleService.findByName(RoleName.ADMIN);
 *   const sellerRole = await this.roleService.findByName(RoleName.SELLER);
 *   const adminRoleId = adminRole._id.toString();
 *   const sellerRoleId = sellerRole._id.toString();
 * }
 * @Roles('65a1234567890abcdef12345') // Admin roleId
 * @Get('admin-only')
 * adminOnlyRoute() {
 *   return { message: 'Admin only' };
 * }
 *
 * @example
 * @Roles('65a1234567890abcdef12345', '65a1234567890abcdef12346') // Admin and Seller roleIds
 * @Post('products')
 * createProduct() {
 *   return { message: 'Product created' };
 * }
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roleIds: string[]): CustomDecorator<string> =>
  SetMetadata(ROLES_KEY, roleIds);

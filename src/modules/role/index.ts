/**
 * Role Module Barrel Export
 * Provides convenient access to all role-related exports
 *
 * IMPORTANT: Role names and enums should ONLY be used in seeders.
 * For application logic, use RoleCacheService to get roleIds.
 */

// Module
export { RoleModule } from './role.module';

// Services
export { RoleService } from './role.service';
export { RoleCacheService } from './role-cache.service';

// Schema
export { Role, RoleSchema } from './schemas/role.schema';
export type { RoleDocument } from './schemas/role.schema';

// Enums (USE ONLY IN SEEDERS)
export { RoleName } from './enums/role-name.enum';
export { RoleStatus } from './enums/role-status.enum';

// DTOs
export { RoleResponseDto } from './dto/role-response.dto';
export { CreateRoleDto } from './dto/create-role.dto';
export { UpdateRoleDto } from './dto/update-role.dto';

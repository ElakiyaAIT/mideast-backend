import { IsEnum, IsString, IsOptional, MinLength } from 'class-validator';
import { RoleName } from '../enums/role-name.enum';
import { RoleStatus } from '../enums/role-status.enum';

/**
 * DTO for creating a new role
 */
export class CreateRoleDto {
  @IsEnum(RoleName, {
    message: 'Role name must be one of: Admin, Seller, Buyer',
  })
  name: RoleName;

  @IsString()
  @MinLength(10, {
    message: 'Description must be at least 10 characters long',
  })
  description: string;

  @IsOptional()
  @IsEnum(RoleStatus, {
    message: 'Status must be either active or inactive',
  })
  status?: RoleStatus;
}

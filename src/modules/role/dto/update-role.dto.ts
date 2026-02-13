import { IsEnum, IsString, IsOptional, MinLength } from 'class-validator';
import { RoleStatus } from '../enums/role-status.enum';

/**
 * DTO for updating a role
 * All fields are optional as this is a partial update
 */
export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(10, {
    message: 'Description must be at least 10 characters long',
  })
  description?: string;

  @IsOptional()
  @IsEnum(RoleStatus, {
    message: 'Status must be either active or inactive',
  })
  status?: RoleStatus;
}

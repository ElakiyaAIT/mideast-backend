import { Types } from 'mongoose';
import { RoleName } from '../enums/role-name.enum';
import { RoleStatus } from '../enums/role-status.enum';

/**
 * DTO for Role response
 * Used when returning role data to clients
 */
export class RoleResponseDto {
  id: string | Types.ObjectId;
  name: RoleName;
  description: string;
  status: RoleStatus;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<RoleResponseDto>) {
    Object.assign(this, partial);
  }
}

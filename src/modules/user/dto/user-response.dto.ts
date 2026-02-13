import { RoleName } from '../../role/enums/role-name.enum';

export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: { _id: string; name: string };
  roleName?: RoleName;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

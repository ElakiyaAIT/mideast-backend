import { Controller, Get, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { RoleResponseDto } from './dto/role-response.dto';
import { RoleName } from './enums/role-name.enum';

@Controller('roles')
@UseGuards(JwtAuthGuard, AdminGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  async findAll(): Promise<RoleResponseDto[]> {
    const roles = await this.roleService.findAllActive();

    return roles
      .filter((role) => role.name !== RoleName.ADMIN)
      .map((role) => ({
        id: role._id.toString(),
        name: role.name,
        description: role.description,
        status: role.status,
        createdAt: role.createdAt as Date,
        updatedAt: role.updatedAt as Date,
      }));
  }
}

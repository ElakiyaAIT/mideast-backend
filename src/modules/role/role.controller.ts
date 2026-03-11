import { Controller, Get, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { AdminGuard } from '../../common/guards/admin.guard';
import { RoleResponseDto } from './dto/role-response.dto';
import { RoleName } from './enums/role-name.enum';
import { AdminJwtAuthGuard } from '@/common/guards/admin-jwt.guard';
import { AdminRoute } from '@/common/decorators/admin-route.decorator';

@Controller('roles')
@AdminRoute()
@UseGuards(AdminJwtAuthGuard, AdminGuard)
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

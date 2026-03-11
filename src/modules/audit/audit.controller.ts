import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AuditAction } from './enums/audit-action.enum';
import { AuditLog } from './schemas/audit-log.schema';
import { PaginationResultDto } from '@/common/dto/pagination.dto';
import { AdminJwtAuthGuard } from '@/common/guards/admin-jwt.guard';
import { AdminRoute } from '@/common/decorators/admin-route.decorator';

@Controller('admin/audit-logs')
@AdminRoute()
@UseGuards(AdminJwtAuthGuard, AdminGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('adminId') adminId?: string,
    @Query('action') action?: AuditAction,
    @Query('targetType') targetType?: string,
  ): Promise<PaginationResultDto<AuditLog>> {
    return this.auditService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      adminId,
      action,
      targetType,
    });
  }
}

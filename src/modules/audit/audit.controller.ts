import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AuditAction } from './enums/audit-action.enum';
import { AuditLog } from './schemas/audit-log.schema';
import { PaginationResultDto } from '@/common/dto/pagination.dto';

@Controller('admin/audit-logs')
@UseGuards(JwtAuthGuard, AdminGuard)
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

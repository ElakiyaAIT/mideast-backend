import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtUser } from '@/common/dto/response.dto';
import { NotificationType } from './enums/notification-type.enum';
import { Notification } from './schemas/notification.schema';
import { NotificationStatus } from './enums/notification-status.enum';
import { PaginationResultDto } from '@/common/dto/pagination.dto';
import { AdminJwtAuthGuard } from '@/common/guards/admin-jwt.guard';
import { AdminRoute } from '@/common/decorators/admin-route.decorator';

@Controller('admin/notifications')
@AdminRoute()
@UseGuards(AdminJwtAuthGuard, AdminGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  send(
    @Body()
    sendDto: { type: NotificationType; recipientIds: string[]; subject: string; message: string },
    @CurrentUser() user: JwtUser,
  ): Promise<Notification> {
    return this.notificationService.send({
      ...sendDto,
      createdBy: user._id,
    });
  }

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: NotificationStatus,
    @Query('type') type?: NotificationType,
  ): Promise<PaginationResultDto<Notification>> {
    return this.notificationService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      type,
    });
  }
}

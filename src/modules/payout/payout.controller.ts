import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PayoutService } from './payout.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { PayoutStatus } from './enums';
import { PaginationResultDto } from '@/common/dto/pagination.dto';
import { Payout } from './schemas/payout.schema';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtUser } from '@/common/dto/response.dto';

@Controller('admin/payouts')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: PayoutStatus,
    @Query('sellerId') sellerId?: string,
  ): Promise<PaginationResultDto<Payout>> {
    return this.payoutService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      sellerId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Payout> {
    return this.payoutService.findOne(id);
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body('notes') notes: string,
    @CurrentUser() user: JwtUser,
  ): Promise<Payout> {
    return this.payoutService.approve(id, user._id, notes);
  }

  @Post(':id/hold')
  hold(@Param('id') id: string, @Body('holdReason') holdReason: string): Promise<Payout> {
    return this.payoutService.hold(id, holdReason);
  }
}

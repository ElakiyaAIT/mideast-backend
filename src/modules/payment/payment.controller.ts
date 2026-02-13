import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { PaymentStatus } from './enums';
import { PaginationResultDto } from '@/common/dto/pagination.dto';
import { Payment } from './schemas/payment.schema';

@Controller('admin/payments')
@UseGuards(JwtAuthGuard, AdminGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: PaymentStatus,
    @Query('orderId') orderId?: string,
  ): Promise<PaginationResultDto<Payment>> {
    return this.paymentService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      orderId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Payment> {
    return this.paymentService.findOne(id);
  }

  @Post(':id/refund')
  refund(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Body('amount') amount: number,
  ): Promise<Payment> {
    return this.paymentService.refund(id, reason, amount);
  }
}

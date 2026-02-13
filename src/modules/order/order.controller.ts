import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { OrderStatus } from './enums';
import { PaginationResultDto } from '@/common/dto/pagination.dto';
import { Order } from './schemas/order.schema';

@Controller('admin/orders')
@UseGuards(JwtAuthGuard, AdminGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: OrderStatus,
    @Query('buyerId') buyerId?: string,
    @Query('sellerId') sellerId?: string,
  ): Promise<PaginationResultDto<Order>> {
    return this.orderService.findAll({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status,
      buyerId,
      sellerId,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Order> {
    return this.orderService.findOne(id);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto): Promise<Order> {
    return this.orderService.updateStatus(id, dto.status, dto.trackingNumber, dto.adminNotes);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body('reason') reason: string): Promise<Order> {
    return this.orderService.cancel(id, reason);
  }
}

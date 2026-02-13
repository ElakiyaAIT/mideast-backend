import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { SalesReport } from './dto/report-type.dto';

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  getSalesReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<SalesReport> {
    return this.reportsService.getSalesReport(new Date(startDate), new Date(endDate));
  }

  @Get('auctions')
  getAuctionReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{
    period: { start: Date; end: Date };
    totalAuctions: number;
    totalRevenue: number;
    auctions: { title: string; totalLots: number; soldLots: number; revenue: number }[];
  }> {
    return this.reportsService.getAuctionReport(new Date(startDate), new Date(endDate));
  }

  @Get('user-activity')
  getUserActivityReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<{
    period: { start: Date; end: Date };
    newRegistrations: number;
  }> {
    return this.reportsService.getUserActivityReport(new Date(startDate), new Date(endDate));
  }
}

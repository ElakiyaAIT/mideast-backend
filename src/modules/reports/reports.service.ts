import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from '../order/schemas/order.schema';
import { Auction } from '../auction/schemas/auction.schema';
import { User } from '../user/schemas/user.schema';
import { OrderPopulated } from './dto/order-populated.dto';
import { SalesReport } from './dto/report-type.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel('Order') private orderModel: Model<Order>,
    @InjectModel('Auction') private auctionModel: Model<Auction>,
    @InjectModel('User') private userModel: Model<User>,
  ) {}

  async getSalesReport(startDate: Date, endDate: Date): Promise<SalesReport> {
    const orders = await this.orderModel
      .find({
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $in: ['paid', 'completed'] },
        isDeleted: false,
      })
      .populate('equipmentId')
      .lean<OrderPopulated[]>();

    const totalSales = orders.reduce((sum, order) => sum + order.salePrice, 0);

    const totalOrders = orders.length;

    const byCategory: Record<string, { sales: number; orders: number }> = {};

    for (const order of orders) {
      const category = order.equipmentId?.categoryId?.name ?? 'Unknown';

      if (!byCategory[category]) {
        byCategory[category] = { sales: 0, orders: 0 };
      }

      byCategory[category].sales += order.salePrice;
      byCategory[category].orders += 1;
    }

    return {
      period: { start: startDate, end: endDate },
      totalSales,
      totalOrders,
      byCategory: Object.entries(byCategory).map(([category, data]) => ({
        category,
        sales: data.sales,
        orders: data.orders,
      })),
    };
  }

  async getAuctionReport(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    period: { start: Date; end: Date };
    totalAuctions: number;
    totalRevenue: number;
    auctions: { title: string; totalLots: number; soldLots: number; revenue: number }[];
  }> {
    const auctions = await this.auctionModel
      .find({
        startDate: { $gte: startDate, $lte: endDate },
        isDeleted: false,
      })
      .exec();

    const totalAuctions = auctions.length;
    const totalRevenue = auctions.reduce((sum, auction) => sum + (auction.totalRevenue || 0), 0);

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      totalAuctions,
      totalRevenue,
      auctions: auctions.map((a) => ({
        title: a.title,
        totalLots: a.totalLots,
        soldLots: a.soldLots,
        revenue: a.totalRevenue,
      })),
    };
  }

  async getUserActivityReport(
    startDate: Date,
    endDate: Date,
  ): Promise<{
    period: { start: Date; end: Date };
    newRegistrations: number;
  }> {
    const newUsers = await this.userModel.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      isDeleted: false,
    });

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      newRegistrations: newUsers,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order } from './schemas/order.schema';
import { OrderStatus, OrderType } from './enums';
import { CommissionService } from '../commission/commission.service';
import { PaginationResultDto } from '@/common/dto/pagination.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<Order>,
    private commissionService: CommissionService,
  ) {}

  async create(data: {
    type: OrderType;
    equipmentId: string;
    buyerId: string;
    sellerId: string;
    salePrice: number;
    auctionId?: string;
    shippingAddress?: {
      address: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  }): Promise<Order> {
    // Generate order number
    const year = new Date().getFullYear();
    const count = await this.orderModel.countDocuments({
      createdAt: { $gte: new Date(`${year}-01-01`) },
    });
    const orderNumber = `ORD-${year}-${String(count + 1).padStart(6, '0')}`;

    // Calculate commission
    const commission = this.commissionService.calculateCommission(data.salePrice);

    const order = new this.orderModel({
      orderNumber,
      type: data.type,
      equipmentId: new Types.ObjectId(data.equipmentId),
      buyerId: new Types.ObjectId(data.buyerId),
      sellerId: new Types.ObjectId(data.sellerId),
      auctionId: data.auctionId ? new Types.ObjectId(data.auctionId) : undefined,
      salePrice: data.salePrice,
      commissionFee: commission.commissionAmount,
      commissionPercentage: commission.percentage,
      totalAmount: data.salePrice,
      sellerPayout: data.salePrice - commission.commissionAmount,
      shippingAddress: data.shippingAddress,
      status: OrderStatus.PENDING_PAYMENT,
    });

    const savedOrder = await order.save();

    // Create commission record
    await this.commissionService.createCommission({
      orderId: savedOrder._id.toString(),
      salePrice: data.salePrice,
    });

    return savedOrder;
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
    buyerId?: string;
    sellerId?: string;
  }): Promise<PaginationResultDto<Order>> {
    const { page = 1, limit = 20, status, buyerId, sellerId } = filters;
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = { isDeleted: false };

    if (status) query.status = status;
    if (buyerId) query.buyerId = new Types.ObjectId(buyerId);
    if (sellerId) query.sellerId = new Types.ObjectId(sellerId);

    const [items, total] = await Promise.all([
      this.orderModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('equipmentId', 'title make model')
        .populate('buyerId', 'firstName lastName email')
        .populate('sellerId', 'firstName lastName email')
        .exec(),
      this.orderModel.countDocuments(query),
    ]);

    return new PaginationResultDto<Order>(items, total, page, limit);
  }

  async findOne(id: string): Promise<Order> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid order ID');
    }

    const order = await this.orderModel
      .findOne({ _id: id, isDeleted: false })
      .populate('equipmentId')
      .populate('buyerId', 'firstName lastName email')
      .populate('sellerId', 'firstName lastName email')
      .populate('auctionId', 'title')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    trackingNumber?: string,
    adminNotes?: string,
  ): Promise<Order> {
    const order = await this.findOne(id);

    order.status = status;

    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    if (adminNotes) {
      order.adminNotes = adminNotes;
    }

    if (status === OrderStatus.PAID) {
      order.paidAt = new Date();
    } else if (status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    } else if (status === OrderStatus.COMPLETED) {
      order.completedAt = new Date();
    }

    return order.save();
  }

  async cancel(id: string, reason: string): Promise<Order> {
    const order = await this.findOne(id);
    order.status = OrderStatus.CANCELLED;
    order.adminNotes = reason;
    return order.save();
  }
}

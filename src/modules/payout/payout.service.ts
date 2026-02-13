import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payout } from './schemas/payout.schema';
import { PayoutStatus } from './enums';
import { PaginationResultDto } from '@/common/dto/pagination.dto';

@Injectable()
export class PayoutService {
  constructor(
    @InjectModel(Payout.name)
    private payoutModel: Model<Payout>,
  ) {}

  async findAll(filters: {
    page?: number;
    limit?: number;
    status?: PayoutStatus;
    sellerId?: string;
  }): Promise<PaginationResultDto<Payout>> {
    const { page = 1, limit = 20, status, sellerId } = filters;
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (sellerId) query.sellerId = new Types.ObjectId(sellerId);

    const [items, total] = await Promise.all([
      this.payoutModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('sellerId', 'firstName lastName email')
        .populate('orderId', 'orderNumber salePrice')
        .populate('processedBy', 'firstName lastName')
        .exec(),
      this.payoutModel.countDocuments(query),
    ]);

    return new PaginationResultDto<Payout>(items, total, page, limit);
  }

  async findOne(id: string): Promise<Payout> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid payout ID');
    }

    const payout = await this.payoutModel
      .findById(id)
      .populate('sellerId', 'firstName lastName email')
      .populate('orderId')
      .populate('processedBy', 'firstName lastName')
      .exec();

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    return payout;
  }

  async approve(id: string, processedBy: string, notes?: string): Promise<Payout> {
    const payout = await this.findOne(id);

    if (payout.status !== PayoutStatus.PENDING) {
      throw new Error('Only pending payouts can be approved');
    }

    payout.status = PayoutStatus.PROCESSING;
    payout.processedBy = new Types.ObjectId(processedBy);
    payout.processedAt = new Date();
    if (notes) payout.notes = notes;

    return payout.save();
  }

  async hold(id: string, holdReason: string): Promise<Payout> {
    const payout = await this.findOne(id);

    payout.status = PayoutStatus.ON_HOLD;
    payout.holdReason = holdReason;

    return payout.save();
  }

  async complete(id: string, gatewayTransactionId: string): Promise<Payout> {
    const payout = await this.findOne(id);

    payout.status = PayoutStatus.COMPLETED;
    payout.gatewayTransactionId = gatewayTransactionId;

    return payout.save();
  }
}

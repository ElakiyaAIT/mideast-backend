import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment } from './schemas/payment.schema';
import { PaymentStatus, PaymentType } from './enums';
import { PaginationResultDto } from '@/common/dto/pagination.dto';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<Payment>,
  ) {}

  async findAll(filters: {
    page?: number;
    limit?: number;
    status?: PaymentStatus;
    orderId?: string;
  }): Promise<PaginationResultDto<Payment>> {
    const { page = 1, limit = 20, status, orderId } = filters;
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};

    if (status) query.status = status;
    if (orderId) query.orderId = new Types.ObjectId(orderId);

    const [items, total] = await Promise.all([
      this.paymentModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('orderId', 'orderNumber salePrice')
        .populate('userId', 'firstName lastName email')
        .exec(),
      this.paymentModel.countDocuments(query),
    ]);

    return new PaginationResultDto<Payment>(items, total, page, limit);
  }

  async findOne(id: string): Promise<Payment> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid payment ID');
    }

    const payment = await this.paymentModel
      .findById(id)
      .populate('orderId')
      .populate('userId', 'firstName lastName email')
      .exec();

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async refund(id: string, reason: string, amount: number): Promise<Payment> {
    const payment = await this.findOne(id);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new Error('Only completed payments can be refunded');
    }

    // Create refund record
    const refund = new this.paymentModel({
      transactionId: `REF-${Date.now()}`,
      type: PaymentType.REFUND,
      orderId: payment.orderId,
      userId: payment.userId,
      amount: amount || payment.amount,
      paymentMethod: payment.paymentMethod,
      status: PaymentStatus.COMPLETED,
      refundedPaymentId: payment._id,
      refundedAt: new Date(),
    });

    await refund.save();

    // Mark original payment as refunded
    payment.status = PaymentStatus.REFUNDED;
    payment.refundedAt = new Date();
    await payment.save();

    return refund;
  }
}

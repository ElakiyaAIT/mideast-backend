import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Commission, CommissionDocument } from './schemas/commission.schema';

@Injectable()
export class CommissionService {
  private fixedFee = 100; // Default $100
  private percentage = 3; // Default 3%

  constructor(
    @InjectModel(Commission.name)
    private commissionModel: Model<Commission>,
  ) {}

  calculateCommission(salePrice: number): {
    fixedFee: number;
    percentage: number;
    commissionAmount: number;
  } {
    const commissionAmount = this.fixedFee + (salePrice * this.percentage) / 100;

    return {
      fixedFee: this.fixedFee,
      percentage: this.percentage,
      commissionAmount,
    };
  }

  async createCommission(data: {
    orderId: string;
    salePrice: number;
    categoryId?: string;
    sellerTier?: string;
  }): Promise<Commission> {
    const { fixedFee, percentage, commissionAmount } = this.calculateCommission(data.salePrice);

    const commission = new this.commissionModel({
      orderId: new Types.ObjectId(data.orderId),
      salePrice: data.salePrice,
      fixedFee,
      percentage,
      commissionAmount,
      categoryId: data.categoryId ? new Types.ObjectId(data.categoryId) : undefined,
      sellerTier: data.sellerTier || 'standard',
    });

    return commission.save();
  }

  async findByOrderId(orderId: string): Promise<CommissionDocument | null> {
    const response = await this.commissionModel
      .findOne({ orderId: new Types.ObjectId(orderId) })
      .exec();
    return response;
  }
}

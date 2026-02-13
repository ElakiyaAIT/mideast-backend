import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommissionDocument = Commission & Document;

@Schema({ timestamps: true })
export class Commission extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true })
  salePrice: number;

  @Prop({ required: true })
  fixedFee: number;

  @Prop({ required: true })
  percentage: number;

  @Prop({ required: true })
  commissionAmount: number;

  @Prop({ type: Types.ObjectId, ref: 'EquipmentCategory' })
  categoryId: Types.ObjectId;

  @Prop()
  sellerTier: string;

  @Prop({ default: false })
  isAdjusted: boolean;

  @Prop()
  adjustmentReason: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  adjustedBy: Types.ObjectId;
}

export const CommissionSchema = SchemaFactory.createForClass(Commission);

// Indexes
CommissionSchema.index({ orderId: 1 }, { unique: true });

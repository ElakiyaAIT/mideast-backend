import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PayoutStatus } from '../enums';

@Schema({ timestamps: true })
export class Payout extends Document {
  @Prop({ required: true, unique: true })
  payoutId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: PayoutStatus, default: PayoutStatus.PENDING })
  status: PayoutStatus;

  // Bank Details
  @Prop()
  bankAccountNumber: string;

  @Prop()
  bankRoutingNumber: string;

  @Prop()
  bankAccountName: string;

  @Prop()
  paymentMethod: string;

  // Processing
  @Prop({ type: Types.ObjectId, ref: 'User' })
  processedBy: Types.ObjectId;

  @Prop({ type: Date })
  processedAt: Date;

  @Prop()
  gatewayTransactionId: string;

  @Prop()
  failureReason: string;

  @Prop()
  notes: string;

  // Hold Reason
  @Prop()
  holdReason: string;
}

export const PayoutSchema = SchemaFactory.createForClass(Payout);

// Indexes
PayoutSchema.index({ sellerId: 1, status: 1 });
PayoutSchema.index({ orderId: 1 });
PayoutSchema.index({ status: 1, createdAt: -1 });

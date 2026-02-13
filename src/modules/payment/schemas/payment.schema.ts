import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentType, PaymentStatus, PaymentMethod } from '../enums';

@Schema({ timestamps: true })
export class Payment extends Document {
  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ enum: PaymentType, required: true })
  type: PaymentType;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ enum: PaymentMethod, required: true })
  paymentMethod: PaymentMethod;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  // Gateway Info
  @Prop()
  gatewayTransactionId: string;

  @Prop({ type: Object })
  gatewayResponse: Record<string, unknown>;

  @Prop({ type: Date })
  processedAt: Date;

  @Prop()
  failureReason: string;

  // Refund
  @Prop({ type: Types.ObjectId, ref: 'Payment' })
  refundedPaymentId: Types.ObjectId;

  @Prop({ type: Date })
  refundedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

// Indexes
PaymentSchema.index({ orderId: 1 });
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

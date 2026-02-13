import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderType, OrderStatus } from '../enums';

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ enum: OrderType, required: true })
  type: OrderType;

  @Prop({ type: Types.ObjectId, ref: 'Equipment', required: true })
  equipmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  buyerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Auction' })
  auctionId: Types.ObjectId;

  // Pricing
  @Prop({ required: true })
  salePrice: number;

  @Prop({ required: true })
  commissionFee: number;

  @Prop({ required: true })
  commissionPercentage: number;

  @Prop({ default: 0 })
  additionalFees: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ required: true })
  sellerPayout: number;

  // Status
  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING_PAYMENT })
  status: OrderStatus;

  @Prop({ type: Date })
  paidAt: Date;

  @Prop({ type: Date })
  deliveredAt: Date;

  @Prop({ type: Date })
  completedAt: Date;

  // Shipping/Delivery
  @Prop({
    type: {
      address: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
  })
  shippingAddress: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  @Prop()
  trackingNumber: string;

  // Notes
  @Prop()
  buyerNotes: string;

  @Prop()
  adminNotes: string;

  // Dispute
  @Prop({ default: false })
  isDisputed: boolean;

  @Prop()
  disputeReason: string;

  @Prop({ type: Date })
  disputeOpenedAt: Date;

  // Audit
  @Prop({ default: false })
  isDeleted: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

// Indexes
OrderSchema.index({ buyerId: 1, status: 1 });
OrderSchema.index({ sellerId: 1, status: 1 });
OrderSchema.index({ equipmentId: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });

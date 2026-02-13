import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Bid extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Equipment', required: true })
  equipmentId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Auction', required: true })
  auctionId: Types.ObjectId;

  @Prop({ required: true })
  bidAmount: number;

  @Prop()
  bidderName: string;

  @Prop()
  bidderExternalId: string;

  @Prop({ required: true })
  bidTime: Date;

  @Prop({ default: false })
  isWinningBid: boolean;

  @Prop({ default: 'external' })
  source: string;

  @Prop()
  externalBidId: string;
}

export const BidSchema = SchemaFactory.createForClass(Bid);

// Indexes
BidSchema.index({ equipmentId: 1, auctionId: 1 });
BidSchema.index({ auctionId: 1, bidAmount: -1 });
BidSchema.index({ isWinningBid: 1 });

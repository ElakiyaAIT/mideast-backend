import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AuctionStatus, AuctionType } from '../enums';

@Schema({ timestamps: true })
export class Auction extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ enum: AuctionType, required: true })
  type: AuctionType;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ enum: AuctionStatus, default: AuctionStatus.SCHEDULED })
  status: AuctionStatus;

  // Location (for live auctions)
  @Prop({
    type: {
      address: String,
      city: String,
      state: String,
    },
  })
  location: {
    address: string;
    city: string;
    state: string;
  };

  // External Platform Integration
  @Prop({
    type: {
      proxibidId: String,
      equipmentfactsId: String,
      proxibidUrl: String,
      equipmentfactsUrl: String,
    },
  })
  externalPlatform: {
    proxibidId?: string;
    equipmentfactsId?: string;
    proxibidUrl?: string;
    equipmentfactsUrl?: string;
  };

  // Media
  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({
    type: [{ name: String, url: String }],
    default: [],
  })
  documents: { name: string; url: string }[];

  // Statistics
  @Prop({ default: 0 })
  totalLots: number;

  @Prop({ default: 0 })
  soldLots: number;

  @Prop({ default: 0 })
  totalRevenue: number;

  // Audit fields
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt: Date;
}

export const AuctionSchema = SchemaFactory.createForClass(Auction);

// Indexes
AuctionSchema.index({ status: 1, startDate: 1 });
AuctionSchema.index({ endDate: 1 });
AuctionSchema.index({ 'externalPlatform.proxibidId': 1 }, { sparse: true });

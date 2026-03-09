import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EquipmentStatus, ListingType } from '../enums';

@Schema({ timestamps: true })
export class Equipment extends Document {
  // Basic Info
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'EquipmentCategory', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sellerId: Types.ObjectId;

  // Listing Details
  @Prop({ enum: ListingType, required: true })
  listingType: ListingType;

  @Prop({ type: Number })
  buyNowPrice: number;

  @Prop({ type: Number })
  reservePrice: number;

  @Prop({ enum: EquipmentStatus, default: EquipmentStatus.DRAFT })
  status: EquipmentStatus;

  // Equipment Details
  @Prop({ required: true })
  make: string;

  @Prop({ required: true })
  models: string;

  @Prop({ required: true })
  year: number;

  @Prop()
  serialNumber: string;

  @Prop({ type: Number })
  hoursUsed: number;

  @Prop()
  condition: string;

  // Dynamic Attributes (flexible)
  @Prop({ type: Object, default: {} })
  attributes: Record<string, string>;

  // Location
  @Prop({
    type: {
      address: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    required: true,
  })
  location: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };

  // Media
  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [String], default: [] })
  videos: string[];

  @Prop({
    type: [{ name: String, url: String }],
    default: [],
  })
  documents: { name: string; url: string }[];

  // ======================
  // NESTED SECTIONS (MATCH DTO)
  // ======================

  @Prop({ type: Object })
  basicDetails?: Record<string, unknown>;

  @Prop({ type: Object })
  general?: Record<string, unknown>;

  @Prop({ type: Object })
  conditionOverview?: Record<string, unknown>;

  @Prop({ type: Object })
  engineCondition?: Record<string, unknown>;

  @Prop({ type: Object })
  hydraulics?: Record<string, unknown>;

  @Prop({ type: Object })
  cabElectronics?: Record<string, unknown>;

  @Prop({ type: Object })
  checkList?: Record<string, unknown>;

  @Prop({ type: Object })
  media?: Record<string, unknown>;

  @Prop({ type: Object })
  additionalInformation?: Record<string, unknown>;

  // Approval Workflow
  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy: Types.ObjectId;

  @Prop({ type: Date })
  approvedAt: Date;

  @Prop()
  rejectionReason: string;

  // Auction Assignment
  @Prop({ type: Types.ObjectId, ref: 'Auction' })
  auctionId: Types.ObjectId;

  // SEO & Visibility
  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: 0 })
  inquiryCount: number;

  // Audit fields
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
}

export const EquipmentSchema = SchemaFactory.createForClass(Equipment);

// Indexes
EquipmentSchema.index({ sellerId: 1, status: 1 });
EquipmentSchema.index({ categoryId: 1, status: 1 });
EquipmentSchema.index({ status: 1, isPublished: 1, isDeleted: 1 });
EquipmentSchema.index({ auctionId: 1 });
EquipmentSchema.index({ make: 1, model: 1, year: 1 });
EquipmentSchema.index({ 'location.state': 1 });
EquipmentSchema.index({ createdAt: -1 });

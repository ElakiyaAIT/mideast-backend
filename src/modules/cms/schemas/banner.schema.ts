import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BannerPosition } from '../enums/banner-position.enum';

@Schema({ timestamps: true })
export class Banner extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  subtitle: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop()
  linkUrl: string;

  @Prop({ enum: BannerPosition, required: true })
  position: BannerPosition;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ default: 0 })
  clickCount: number;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const BannerSchema = SchemaFactory.createForClass(Banner);

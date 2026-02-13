import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class EquipmentCategory extends Document {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ type: Types.ObjectId, ref: 'EquipmentCategory', default: null })
  parentId: Types.ObjectId;

  @Prop({ required: true })
  description: string;

  @Prop()
  imageUrl: string;

  @Prop({ type: Object, default: {} })
  attributeTemplate: Record<string, string>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  sortOrder: number;

  // Audit fields
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ type: Date, default: null })
  deletedAt: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  deletedBy: Types.ObjectId | null;
}

export const EquipmentCategorySchema = SchemaFactory.createForClass(EquipmentCategory);

// Indexes
EquipmentCategorySchema.index({ parentId: 1 });
EquipmentCategorySchema.index({ isActive: 1, isDeleted: 1 });

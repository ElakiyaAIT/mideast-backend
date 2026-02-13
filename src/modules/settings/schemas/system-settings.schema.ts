import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class SystemSettings extends Document {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ required: true })
  value: string;

  @Prop()
  description: string;

  @Prop({ default: 'string' })
  dataType: string;

  @Prop()
  category: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy: Types.ObjectId;
}

export const SystemSettingsSchema = SchemaFactory.createForClass(SystemSettings);

// Indexes
SystemSettingsSchema.index({ category: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { NotificationType } from '../enums/notification-type.enum';
import { NotificationStatus } from '../enums/notification-status.enum';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ enum: NotificationType, required: true })
  type: NotificationType;

  @Prop({ type: [Types.ObjectId], ref: 'User', required: true })
  recipientIds: Types.ObjectId[];

  @Prop({ required: true })
  subject: string;

  @Prop({ required: true })
  message: string;

  @Prop({ enum: NotificationStatus, default: NotificationStatus.PENDING })
  status: NotificationStatus;

  @Prop({ type: Date })
  sentAt: Date;

  @Prop()
  failureReason: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({ required: false, select: false })
  password?: string;

  @Prop({ select: false })
  firebaseUid?: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'Role',
    required: true,
  })
  roleId: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ select: false })
  refreshToken?: string;

  @Prop({ select: false })
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;

  @Prop()
  reasonForDeactivation?: string;

  @Prop({
    type: String,
    default: 'en',
    enum: ['en', 'es'],
  })
  language?: string;

  // Soft Delete fields
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt?: Date;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  deletedBy?: Types.ObjectId;

  // Timestamps are automatically added by Mongoose when timestamps: true
  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Additional indexes (email index is created automatically by unique: true)
UserSchema.index({ roleId: 1 });
UserSchema.index({ createdAt: -1 });
UserSchema.index({ isDeleted: 1 }); // Index for soft delete queries

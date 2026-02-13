import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { RoleName } from '../enums/role-name.enum';
import { RoleStatus } from '../enums/role-status.enum';

export type RoleDocument = Role & Document;

@Schema({
  timestamps: true,
  collection: 'roles',
})
export class Role {
  _id: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(RoleName),
    required: true,
    unique: true,
  })
  name: RoleName;

  @Prop({
    type: String,
    required: true,
  })
  description: string;

  @Prop({
    type: String,
    enum: Object.values(RoleStatus),
    default: RoleStatus.ACTIVE,
  })
  status: RoleStatus;

  // Timestamps are automatically added by Mongoose when timestamps: true
  createdAt?: Date;
  updatedAt?: Date;
}

export const RoleSchema = SchemaFactory.createForClass(Role);

// Create indexes for better query performance
RoleSchema.index({ status: 1 });

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Role, RoleDocument } from './schemas/role.schema';
import { RoleName } from './enums/role-name.enum';
import { RoleStatus } from './enums/role-status.enum';

@Injectable()
export class RoleService {
  constructor(@InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>) {}

  /**
   * Find a role by ID
   */
  async findById(id: string | Types.ObjectId): Promise<RoleDocument | null> {
    return this.roleModel.findById(id).exec();
  }

  /**
   * Find a role by name
   */
  async findByName(name: RoleName): Promise<RoleDocument | null> {
    return this.roleModel.findOne({ name }).exec();
  }

  /**
   * Find all active roles
   */
  async findAllActive(): Promise<RoleDocument[]> {
    return this.roleModel.find({ status: RoleStatus.ACTIVE }).exec();
  }

  /**
   * Find all roles
   */
  async findAll(): Promise<RoleDocument[]> {
    return this.roleModel.find().exec();
  }

  /**
   * Create a role (used by seeders)
   */
  async create(roleData: {
    name: RoleName;
    description: string;
    status?: RoleStatus;
  }): Promise<RoleDocument> {
    const role = new this.roleModel(roleData);
    return role.save();
  }

  /**
   * Update a role
   */
  async update(
    id: string | Types.ObjectId,
    updateData: Partial<Role>,
  ): Promise<RoleDocument | null> {
    return this.roleModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  /**
   * Delete a role
   */
  async delete(id: string | Types.ObjectId): Promise<boolean> {
    const result = await this.roleModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  /**
   * Check if a role exists by name
   */
  async existsByName(name: RoleName): Promise<boolean> {
    const count = await this.roleModel.countDocuments({ name }).exec();
    return count > 0;
  }
}

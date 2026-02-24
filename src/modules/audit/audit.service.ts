import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { AuditLog } from './schemas/audit-log.schema';
import { AuditAction } from './enums/audit-action.enum';
import { PaginationResultDto } from '@/common/dto/pagination.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name)
    private auditLogModel: Model<AuditLog>,
    @InjectConnection()
    private readonly connection: Connection,
  ) {}

  async log(data: {
    adminId: string;
    action: AuditAction;
    targetType: string;
    targetId: string;
    description?: string;
    changes?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<AuditLog> {
    const log = new this.auditLogModel({
      adminId: new Types.ObjectId(data.adminId),
      action: data.action,
      targetType: data.targetType,
      targetId: new Types.ObjectId(data.targetId),
      description: data.description,
      changes: data.changes,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    });

    return log.save();
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    adminId?: string;
    action?: AuditAction;
    targetType?: string;
  }): Promise<PaginationResultDto<AuditLog>> {
    const { page = 1, limit = 20, adminId, action, targetType } = filters;
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};

    if (adminId) query.adminId = new Types.ObjectId(adminId);
    if (action) query.action = action;
    if (targetType) query.targetType = targetType;

    const [items, total] = await Promise.all([
      this.auditLogModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('adminId', 'firstName lastName email')
        .exec(),
      this.auditLogModel.countDocuments(query),
    ]);

    return new PaginationResultDto<AuditLog>(items, total, page, limit);
  }

  // async getDocumentByTarget(targetType: string, id: string) {
  //   try {
  //     const modelName = targetType.charAt(0).toUpperCase() + targetType.slice(1);

  //     const Model = this.connection.model(modelName);

  //     return await Model.findById(id).lean();
  //   } catch (error) {
  //     console.warn(`Model not found for targetType: ${targetType}`);
  //     return null;
  //   }
  // }
}

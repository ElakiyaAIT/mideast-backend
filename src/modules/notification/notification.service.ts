import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './schemas/notification.schema';
import { NotificationType } from './enums/notification-type.enum';
import { NotificationStatus } from './enums/notification-status.enum';
import { PaginationResultDto } from '@/common/dto/pagination.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
  ) {}

  async send(data: {
    type: NotificationType;
    recipientIds: string[];
    subject: string;
    message: string;
    createdBy: string;
  }): Promise<Notification> {
    const notification = new this.notificationModel({
      type: data.type,
      recipientIds: data.recipientIds.map((id) => new Types.ObjectId(id)),
      subject: data.subject,
      message: data.message,
      createdBy: new Types.ObjectId(data.createdBy),
      status: NotificationStatus.SENT,
      sentAt: new Date(),
    });

    // TODO: Integrate with email service
    return notification.save();
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    status?: NotificationStatus;
    type?: NotificationType;
  }): Promise<PaginationResultDto<Notification>> {
    const { page = 1, limit = 20, status, type } = filters;
    const skip = (page - 1) * limit;
    const query: Record<string, string> = {};

    if (status) query.status = status;
    if (type) query.type = type;

    const [items, total] = await Promise.all([
      this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'firstName lastName')
        .exec(),
      this.notificationModel.countDocuments(query),
    ]);

    return new PaginationResultDto<Notification>(items, total, page, limit);
  }
}

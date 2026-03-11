import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Equipment } from './schemas/equipment.schema';
import {
  CreateEquipmentDto,
  UpdateEquipmentDto,
  ApproveEquipmentDto,
  RejectEquipmentDto,
  FilterEquipmentDto,
  BulkApproveDto,
} from './dto';
import { EquipmentStatus } from './enums';
import { PaginationResultDto } from '@/common/dto/pagination.dto';

@Injectable()
export class EquipmentService {
  private readonly logger = new Logger(EquipmentService.name);

  constructor(
    @InjectModel(Equipment.name)
    private equipmentModel: Model<Equipment>,
  ) {}

  async create(createDto: CreateEquipmentDto): Promise<Equipment> {
    const equipment = new this.equipmentModel({
      ...createDto,
      status: EquipmentStatus.PENDING_APPROVAL,
      createdBy: createDto.sellerId,
    });

    return equipment.save();
  }

  async findAll(filters: FilterEquipmentDto): Promise<PaginationResultDto<Equipment>> {
    const {
      page = 1,
      limit = 20,
      status,
      categoryId,
      sellerId,
      sortBy = 'createdAt',
      order = 'desc',
      search,
      isPublished,
      isFeatured,
      isDeleted,
    } = filters;

    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};

    // Handle isDeleted filter - default to false if not explicitly provided
    if (isDeleted !== undefined) {
      query.isDeleted = isDeleted;
    } else {
      query.isDeleted = false;
    }

    if (status) {
      query.status = status;
    }

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (sellerId) {
      query.sellerId = sellerId;
    }

    if (isPublished !== undefined) {
      query.isPublished = isPublished;
    }

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const sortObj: Record<string, 1 | -1> = { [sortBy]: sortOrder };

    const [items, total] = await Promise.all([
      this.equipmentModel
        .find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('categoryId', 'name slug')
        .populate('sellerId', 'firstName lastName email')
        .populate('approvedBy', 'firstName lastName')
        .exec(),
      this.equipmentModel.countDocuments(query),
    ]);

    return new PaginationResultDto<Equipment>(items, total, page, limit);
  }

  async findOne(id: string): Promise<Equipment> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid equipment ID');
    }

    const equipment = await this.equipmentModel
      .findOne({ _id: id, isDeleted: false })
      .populate('categoryId', 'name slug attributeTemplate')
      .populate('sellerId', 'firstName lastName email')
      .populate('approvedBy', 'firstName lastName')
      .populate('auctionId', 'title startDate endDate')
      .exec();

    if (!equipment) {
      throw new NotFoundException('Equipment not found');
    }

    return equipment;
  }

  async update(id: string, updateDto: UpdateEquipmentDto, updatedBy?: string): Promise<Equipment> {
    const equipment = await this.findOne(id);

    Object.assign(equipment, updateDto);

    if (updatedBy) {
      equipment.updatedBy = new Types.ObjectId(updatedBy);
    }

    return equipment.save();
  }

  async approve(id: string, approveDto: ApproveEquipmentDto, adminId: string): Promise<Equipment> {
    const equipment = await this.findOne(id);

    if (equipment.status !== EquipmentStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending equipment can be approved');
    }

    equipment.status = EquipmentStatus.APPROVED;
    equipment.approvedBy = new Types.ObjectId(adminId);
    equipment.approvedAt = new Date();

    if (approveDto.isPublished !== undefined) {
      equipment.isPublished = approveDto.isPublished;
      // if (approveDto.isPublished) {
      //   equipment.status = EquipmentStatus.ACTIVE;
      // }
    }

    if (approveDto.isFeatured !== undefined) {
      equipment.isFeatured = approveDto.isFeatured;
    }

    equipment.updatedBy = new Types.ObjectId(adminId);

    return equipment.save();
  }

  async reject(id: string, rejectDto: RejectEquipmentDto, adminId: string): Promise<Equipment> {
    const equipment = await this.findOne(id);

    if (equipment.status !== EquipmentStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only pending equipment can be rejected');
    }

    equipment.status = EquipmentStatus.REJECTED;
    equipment.rejectionReason = rejectDto.rejectionReason;
    equipment.updatedBy = new Types.ObjectId(adminId);

    return equipment.save();
  }

  async bulkApprove(
    bulkApproveDto: BulkApproveDto,
    adminId: string,
  ): Promise<{ approved: number; failed: number }> {
    let approved = 0;
    let failed = 0;

    for (const equipmentId of bulkApproveDto.equipmentIds) {
      try {
        await this.approve(equipmentId, { isPublished: true, isFeatured: false }, adminId);
        approved++;
      } catch (error) {
        this.logger.error(`Failed to approve equipment ID ${equipmentId}: ${error}`);
        failed++;
      }
    }

    return { approved, failed };
  }

  async remove(id: string, deletedBy: string): Promise<Equipment> {
    const equipment = await this.findOne(id);

    equipment.isDeleted = true;
    equipment.deletedAt = new Date();
    equipment.deletedBy = new Types.ObjectId(deletedBy);

    return equipment.save();
  }

  async getPendingApprovals(
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginationResultDto<Equipment>> {
    return this.findAll({
      page,
      limit,
      status: EquipmentStatus.PENDING_APPROVAL,
      sortBy: 'createdAt',
      order: 'asc',
    });
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.equipmentModel.updateOne({ _id: id }, { $inc: { viewCount: 1 } });
  }

  async incrementInquiryCount(id: string): Promise<void> {
    await this.equipmentModel.updateOne({ _id: id }, { $inc: { inquiryCount: 1 } });
  }

  async getLatest(): Promise<Equipment[]> {
    const result = await this.findAll({
      page: 1,
      limit: 3,
      isPublished: true,
      status: EquipmentStatus.APPROVED,
      sortBy: 'createdAt',
      order: 'desc',
    });

    return result.items;
  }

  async getRelatedByCategory(
    id: string,
    page: number = 1,
    limit: number = 3,
  ): Promise<PaginationResultDto<Equipment>> {
    //  Get the current equipment
    const equipment = await this.findOne(id);
    const categoryId = equipment.categoryId?._id || equipment.categoryId;

    const query: Record<string, unknown> = {
      categoryId: categoryId.toString(),
      _id: { $ne: new Types.ObjectId(id) }, // ensure proper ObjectId comparison, remove current equipment
      isDeleted: false,
      isPublished: true,
    };

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.equipmentModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('categoryId', 'name slug')
        .populate('sellerId', 'firstName lastName email')
        .exec(),
      this.equipmentModel.countDocuments(query),
    ]);

    return new PaginationResultDto<Equipment>(items, total, page, limit);
  }
}

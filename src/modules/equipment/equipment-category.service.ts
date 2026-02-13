import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EquipmentCategory } from './schemas/equipment-category.schema';
import { CreateEquipmentCategoryDto, UpdateEquipmentCategoryDto } from './dto';
import { PaginationResultDto } from '@/common/dto/pagination.dto';

@Injectable()
export class EquipmentCategoryService {
  constructor(
    @InjectModel(EquipmentCategory.name)
    private categoryModel: Model<EquipmentCategory>,
  ) {}

  async create(createDto: CreateEquipmentCategoryDto): Promise<EquipmentCategory> {
    // Check if slug already exists
    const existing = await this.categoryModel.findOne({
      slug: createDto.slug,
      isDeleted: false,
    });

    if (existing) {
      throw new ConflictException('Category with this slug already exists');
    }

    const category = new this.categoryModel(createDto);
    return category.save();
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    parentId?: string;
    isActive?: boolean;
  }): Promise<PaginationResultDto<EquipmentCategory>> {
    const { page = 1, limit = 20, parentId, isActive } = filters;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { isDeleted: false };

    if (parentId !== undefined) {
      query.parentId = parentId === 'null' ? null : parentId;
    }

    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    const [items, total] = await Promise.all([
      this.categoryModel
        .find(query)
        .sort({ sortOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('parentId', 'name slug')
        .exec(),
      this.categoryModel.countDocuments(query),
    ]);

    return new PaginationResultDto<EquipmentCategory>(items, total, page, limit);
  }

  async findOne(id: string): Promise<EquipmentCategory> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid category ID');
    }

    const category = await this.categoryModel
      .findOne({ _id: id, isDeleted: false })
      .populate('parentId', 'name slug')
      .exec();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateDto: UpdateEquipmentCategoryDto): Promise<EquipmentCategory> {
    const category = await this.findOne(id);

    // Check if slug is being updated and if it's unique
    if (updateDto.slug && updateDto.slug !== category.slug) {
      const existing = await this.categoryModel.findOne({
        slug: updateDto.slug,
        isDeleted: false,
        _id: { $ne: id },
      });

      if (existing) {
        throw new ConflictException('Category with this slug already exists');
      }
    }

    Object.assign(category, updateDto);
    return category.save();
  }

  async remove(id: string, deletedBy: string): Promise<EquipmentCategory> {
    const category = await this.findOne(id);

    // Check if category has subcategories
    const subcategories = await this.categoryModel.countDocuments({
      parentId: id,
      isDeleted: false,
    });

    if (subcategories > 0) {
      throw new ConflictException('Cannot delete category with subcategories');
    }

    category.isDeleted = true;
    category.deletedAt = new Date();
    category.deletedBy = new Types.ObjectId(deletedBy);

    return category.save();
  }

  async restore(id: string): Promise<EquipmentCategory> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid category ID');
    }

    const category = await this.categoryModel.findOne({ _id: id, isDeleted: true }).exec();

    if (!category) {
      throw new NotFoundException('Category not found or not deleted');
    }

    category.isDeleted = false;
    category.deletedAt = null;
    category.deletedBy = null;

    return category.save();
  }
  
}


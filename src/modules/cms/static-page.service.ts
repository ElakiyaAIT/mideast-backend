import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { StaticPage } from './schemas/static-page.schema';
import { CreateStaticPageDto } from './dto/create-static-page.dto';
import { UpdateStaticPageDto } from './dto/update-static-page.dto';
import { PaginationResultDto } from '@/common/dto/pagination.dto';

@Injectable()
export class StaticPageService {
  constructor(
    @InjectModel(StaticPage.name)
    private staticPageModel: Model<StaticPage>,
  ) {}

  async create(createDto: CreateStaticPageDto): Promise<StaticPage> {
    const page = new this.staticPageModel(createDto);
    return page.save();
  }

  async findAll(filters: {
    page?: number;
    limit?: number;
    isPublished?: boolean;
  }): Promise<PaginationResultDto<StaticPage>> {
    const { page = 1, limit = 9 } = filters;
    const skip = (page - 1) * limit;
    const query: Record<string, unknown> = {};
    const [items, total] = await Promise.all([
      this.staticPageModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.staticPageModel.countDocuments(query),
    ]);
    return new PaginationResultDto<StaticPage>(items, total, page, limit);
  }

  async findOne(slug: string): Promise<StaticPage> {
    const page = await this.staticPageModel.findOne({ slug }).exec();

    if (!page) {
      throw new NotFoundException('Page not found');
    }

    return page;
  }

  async update(
    slug: string,
    updateDto: UpdateStaticPageDto,
    updatedBy: string,
  ): Promise<StaticPage> {
    const page = await this.findOne(slug);
    Object.assign(page, updateDto);
    page.updatedBy = new Types.ObjectId(updatedBy);
    return page.save();
  }

  async remove(slug: string): Promise<void> {
    await this.staticPageModel.deleteOne({ slug });
  }
}

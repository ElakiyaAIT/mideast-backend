import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Testimonial, TestimonialDocument } from './schemas/testimonial.schema';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { PaginationResultDto } from '@/common/dto/pagination.dto';

@Injectable()
export class TestimonialsService {
  constructor(
    @InjectModel(Testimonial.name)
    private testimonialModel: Model<TestimonialDocument>,
  ) {}

  async create(dto: CreateTestimonialDto) {
    return this.testimonialModel.create(dto);
  }

  async findAll(filters: {
  page?: number;
  limit?: number;
  isActive?: boolean;
}): Promise<PaginationResultDto<Testimonial>> {
  const { page = 1, limit = 20, isActive } = filters;

  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};

  // Optional filter for public/admin usage
  if (isActive !== undefined) {
    query.isActive = isActive;
  }

  const [items, total] = await Promise.all([
    this.testimonialModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    this.testimonialModel.countDocuments(query),
  ]);

  return new PaginationResultDto<Testimonial>(
    items,
    total,
    page,
    limit,
  );
}

  async findOne(id: string) {
    const testimonial = await this.testimonialModel.findById(id);
    if (!testimonial) throw new NotFoundException('Testimonial not found');
    return testimonial;
  }

  async update(id: string, dto: UpdateTestimonialDto) {
    const updated = await this.testimonialModel.findByIdAndUpdate(
      id,
      dto,
      { new: true },
    );

    if (!updated) throw new NotFoundException('Testimonial not found');
    return updated;
  }

  async remove(id: string) {
    const deleted = await this.testimonialModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('Testimonial not found');
    return { message: 'Deleted successfully' };
  }
}                                                       

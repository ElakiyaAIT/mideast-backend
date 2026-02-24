import { Controller, Get, Query } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { Public } from '@/common/decorators/public.decorator';
import { PaginationResultDto } from '@/common/dto/pagination.dto';
import { Testimonial } from './schemas/testimonial.schema';

@Controller('testimonials')
export class PublicTestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Public()
  @Get()
  findAll(
    @Query() filters: { page?: number; limit?: number },
  ): Promise<PaginationResultDto<Testimonial>> {
    return this.testimonialsService.findAll({
      ...filters,
      isActive: true,
    });
  }
}

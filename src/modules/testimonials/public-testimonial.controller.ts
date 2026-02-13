import { Controller, Get, Query } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { Public } from '@/common/decorators/public.decorator';

@Controller('testimonials')
export class PublicTestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  @Public()
@Get()
findAll(@Query() filters: { page?: number; limit?: number }) {
  return this.testimonialsService.findAll({
    ...filters,
    isActive: true,
  });
}

}

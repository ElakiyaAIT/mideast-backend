import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Get,
} from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';
import { AdminGuard } from '@/common/guards/admin.guard';
import { PaginationResultDto } from '@/common/dto/pagination.dto';
import { Testimonial } from './schemas/testimonial.schema';
import { AdminJwtAuthGuard } from '@/common/guards/admin-jwt.guard';
import { AdminRoute } from '@/common/decorators/admin-route.decorator';

@Controller('admin/testimonials')
@AdminRoute()
@UseGuards(AdminJwtAuthGuard, AdminGuard)
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  //PROTECTED - GET
  @Get()
  findAll(
    @Query() filters: { page?: number; limit?: number; isActive?: boolean },
  ): Promise<PaginationResultDto<Testimonial>> {
    return this.testimonialsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Testimonial> {
    return this.testimonialsService.findOne(id);
  }
  //  PROTECTED - Create
  @Post()
  create(@Body() dto: CreateTestimonialDto): Promise<Testimonial> {
    return this.testimonialsService.create(dto);
  }

  // PROTECTED - Update
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTestimonialDto): Promise<Testimonial> {
    return this.testimonialsService.update(id, dto);
  }

  //  PROTECTED - Delete
  @Delete(':id')
  remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.testimonialsService.remove(id);
  }
}

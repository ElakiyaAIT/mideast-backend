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
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PaginationResultDto } from '@/common/dto/pagination.dto';
import { Testimonial } from './schemas/testimonial.schema';

@Controller('admin/testimonials')
@UseGuards(JwtAuthGuard, AdminGuard)
export class TestimonialsController {
  constructor(private readonly testimonialsService: TestimonialsService) {}

  //PROTECTED - GET
  @Get()
findAll(@Query() filters: {
  page?: number;
  limit?: number;
  isActive?: boolean;
}): Promise<PaginationResultDto<Testimonial>> {
  return this.testimonialsService.findAll(filters);
}

@Get(':id')
findOne(@Param('id') id:string){
    return this.testimonialsService.findOne(id);
}
  //  PROTECTED - Create
  @Post()
  create(@Body() dto: CreateTestimonialDto) {
    return this.testimonialsService.create(dto);
  }

  // PROTECTED - Update
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTestimonialDto,
  ) {
    return this.testimonialsService.update(id, dto);
  }

  //  PROTECTED - Delete
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.testimonialsService.remove(id);
  }
}

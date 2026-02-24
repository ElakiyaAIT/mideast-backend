import { Module } from '@nestjs/common';
import { TestimonialsService } from './testimonials.service';
import { TestimonialsController } from './testimonials.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Testimonial, TestimonialSchema } from './schemas/testimonial.schema';
import { PublicTestimonialsController } from './public-testimonial.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Testimonial.name, schema: TestimonialSchema }])],
  controllers: [TestimonialsController, PublicTestimonialsController],
  providers: [TestimonialsService],
})
export class TestimonialsModule {}

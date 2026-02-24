import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTestimonialDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsOptional()
  image: string | null;

  @IsString()
  @IsNotEmpty()
  review: string;
}

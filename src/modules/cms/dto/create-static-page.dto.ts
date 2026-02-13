import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';

export class CreateStaticPageDto {
  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  metaKeywords?: string[];

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

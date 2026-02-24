import { Transform } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
  IsMongoId,
} from 'class-validator';

export class CreateEquipmentCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsMongoId()
  @IsOptional()
  parentId?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === '') return null; // convert empty string to null
    return value as string;
  })
  imageUrl?: string | null;

  @IsObject()
  @IsOptional()
  attributeTemplate?: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

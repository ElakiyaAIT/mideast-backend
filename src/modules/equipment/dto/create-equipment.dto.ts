import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsMongoId,
  IsArray,
  IsObject,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListingType } from '../enums';

class LocationDto {
  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsObject()
  @IsOptional()
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export class CreateEquipmentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsMongoId()
  @IsNotEmpty()
  categoryId: string;

  @IsMongoId()
  @IsNotEmpty()
  sellerId: string;

  @IsEnum(ListingType)
  @IsNotEmpty()
  listingType: ListingType;

  @IsNumber()
  @IsOptional()
  @Min(0)
  buyNowPrice?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  reservePrice?: number;

  @IsString()
  @IsNotEmpty()
  make: string;

  @IsString()
  @IsNotEmpty()
  models: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1900)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @IsString()
  @IsOptional()
  serialNumber?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  hoursUsed?: number;

  @IsString()
  @IsOptional()
  condition?: string;

  @IsObject()
  @IsOptional()
  attributes?: Record<string, string>;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsNotEmpty()
  location: LocationDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  videos?: string[];

  @IsArray()
  @IsOptional()
  documents?: { name: string; url: string }[];
}

import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsDate,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AuctionType } from '../enums';

class LocationDto {
  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;
}

class ExternalPlatformDto {
  @IsString()
  @IsOptional()
  proxibidId?: string;

  @IsString()
  @IsOptional()
  equipmentfactsId?: string;

  @IsString()
  @IsOptional()
  proxibidUrl?: string;

  @IsString()
  @IsOptional()
  equipmentfactsUrl?: string;
}

export class CreateAuctionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(AuctionType)
  @IsNotEmpty()
  type: AuctionType;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endDate: Date;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @ValidateNested()
  @Type(() => ExternalPlatformDto)
  @IsOptional()
  externalPlatform?: ExternalPlatformDto;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsArray()
  @IsOptional()
  documents?: { name: string; url: string }[];
}

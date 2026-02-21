import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsDate, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { BannerPosition, BannerStatus } from '../enums/banner-position.enum';

export class CreateBannerDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsString()
  @IsUrl({ require_tld: false })
  imageUrl: string;

  @IsEnum(BannerStatus)
  status: BannerStatus;

  @IsOptional()
  @IsUrl()
  linkUrl?: string;

  @IsEnum(BannerPosition)
  position: BannerPosition;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}

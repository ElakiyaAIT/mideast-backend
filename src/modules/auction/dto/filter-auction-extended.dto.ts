// dto/filter-auction-extended.dto.ts
import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { FilterAuctionDto } from './filter-auction.dto';

export class FilterAuctionExtendedDto extends FilterAuctionDto {
  @IsOptional()
  @IsEnum(['upcoming', 'past'])
  type?: 'upcoming' | 'past';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  auctionName?: string;
}

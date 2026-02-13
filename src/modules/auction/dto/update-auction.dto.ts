import { PartialType } from '@nestjs/mapped-types';
import { CreateAuctionDto } from './create-auction.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { AuctionStatus } from '../enums';

export class UpdateAuctionDto extends PartialType(CreateAuctionDto) {
  @IsEnum(AuctionStatus)
  @IsOptional()
  status?: AuctionStatus;
}

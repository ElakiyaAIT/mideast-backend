// auctions/public-auction.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { AuctionService } from './auction.service';
import { Auction } from './schemas/auction.schema';
import { Public } from '@/common/decorators/public.decorator';
import { FilterAuctionExtendedDto } from './dto/filter-auction-extended.dto';
import { PaginationResultDto } from '@/common/dto/pagination.dto';

@Controller('auctions')
export class PublicAuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  @Public()
  @Get('latest')
  getLatestAuction(): Promise<Auction | null> {
    return this.auctionService.findLatest();
  }

  @Public()
  @Get()
  getAuctions(@Query() filters: FilterAuctionExtendedDto): Promise<PaginationResultDto<Auction>> {
    return this.auctionService.findWithFilters(filters);
  }
}

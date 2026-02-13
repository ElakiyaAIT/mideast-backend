import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuctionService } from './auction.service';
import { CreateAuctionDto, UpdateAuctionDto, AssignEquipmentDto, FilterAuctionDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { JwtUser } from '@/common/dto/response.dto';
import { PaginationResultDto } from '@/common/dto/pagination.dto';
import { Auction } from './schemas/auction.schema';
import { Equipment } from '../equipment/schemas/equipment.schema';
import { Bid } from './schemas/bid.schema';

@Controller('admin/auctions')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  @Post()
  create(@Body() createDto: CreateAuctionDto, @CurrentUser() user: JwtUser): Promise<Auction> {
    return this.auctionService.create(createDto, user._id);
  }

  @Get()
  findAll(@Query() filters: FilterAuctionDto): Promise<PaginationResultDto<Auction>> {
    return this.auctionService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Auction> {
    return this.auctionService.findOne(id);
  }

  @Get(':id/equipment')
  getEquipment(@Param('id') id: string): Promise<Equipment[]> {
    return this.auctionService.getEquipment(id);
  }

  @Get(':id/bids')
  getBids(@Param('id') id: string): Promise<Bid[]> {
    return this.auctionService.getBids(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateAuctionDto,
    @CurrentUser() user: JwtUser,
  ): Promise<Auction> {
    return this.auctionService.update(id, updateDto, user._id);
  }

  @Post(':id/equipment')
  assignEquipment(
    @Param('id') id: string,
    @Body() assignDto: AssignEquipmentDto,
  ): Promise<{ totalLots: number }> {
    return this.auctionService.assignEquipment(id, assignDto);
  }

  @Post(':id/cancel')
  cancelAuction(@Param('id') id: string, @CurrentUser() user: JwtUser): Promise<Auction> {
    return this.auctionService.cancelAuction(id, user._id);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<Auction> {
    return this.auctionService.remove(id);
  }

}


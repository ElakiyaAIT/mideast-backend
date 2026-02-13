import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuctionService } from './auction.service';
import { AuctionController } from './auction.controller';
import { Auction, AuctionSchema } from './schemas/auction.schema';
import { Bid, BidSchema } from './schemas/bid.schema';
import { Equipment, EquipmentSchema } from '../equipment/schemas/equipment.schema';
import { PublicAuctionController } from './public-auction.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Auction.name, schema: AuctionSchema },
      { name: Bid.name, schema: BidSchema },
      { name: Equipment.name, schema: EquipmentSchema },
    ]),
  ],
  controllers: [AuctionController,PublicAuctionController],
  providers: [AuctionService],
  exports: [AuctionService],
})
export class AuctionModule {}

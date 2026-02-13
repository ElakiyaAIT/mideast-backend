import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayoutService } from './payout.service';
import { PayoutController } from './payout.controller';
import { Payout, PayoutSchema } from './schemas/payout.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Payout.name, schema: PayoutSchema }])],
  controllers: [PayoutController],
  providers: [PayoutService],
  exports: [PayoutService],
})
export class PayoutModule {}

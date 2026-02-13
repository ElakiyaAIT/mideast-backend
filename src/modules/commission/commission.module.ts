import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommissionService } from './commission.service';
import { Commission, CommissionSchema } from './schemas/commission.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Commission.name, schema: CommissionSchema }])],
  providers: [CommissionService],
  exports: [CommissionService],
})
export class CommissionModule {}

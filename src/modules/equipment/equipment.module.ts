import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EquipmentService } from './equipment.service';
import { EquipmentController } from './equipment.controller';
import { PublicEquipmentController } from './public-equipment.controller';
import { EquipmentCategoryService } from './equipment-category.service';
import { EquipmentCategoryController } from './equipment-category.controller';
import { Equipment, EquipmentSchema } from './schemas/equipment.schema';
import { EquipmentCategory, EquipmentCategorySchema } from './schemas/equipment-category.schema';
import { PublicEquipmentCategoryController } from './public-equipment-category.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Equipment.name, schema: EquipmentSchema },
      { name: EquipmentCategory.name, schema: EquipmentCategorySchema },
    ]),
  ],
  controllers: [
    EquipmentController,
    PublicEquipmentController,
    EquipmentCategoryController,
    PublicEquipmentCategoryController,
  ],
  providers: [EquipmentService, EquipmentCategoryService],
  exports: [EquipmentService, EquipmentCategoryService],
})
export class EquipmentModule {}

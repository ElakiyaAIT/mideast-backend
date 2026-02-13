import { IsArray, IsMongoId } from 'class-validator';

export class AssignEquipmentDto {
  @IsArray()
  @IsMongoId({ each: true })
  equipmentIds: string[];
}

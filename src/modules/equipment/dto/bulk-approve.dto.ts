import { IsArray, IsMongoId } from 'class-validator';

export class BulkApproveDto {
  @IsArray()
  @IsMongoId({ each: true })
  equipmentIds: string[];
}

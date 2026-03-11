import { IsArray, IsBoolean, IsMongoId, IsOptional } from 'class-validator';

export class BulkApproveDto {
  @IsArray()
  @IsMongoId({ each: true })
  equipmentIds: string[];

  @IsBoolean()
  @IsOptional()
  isPublished: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured: boolean;
}

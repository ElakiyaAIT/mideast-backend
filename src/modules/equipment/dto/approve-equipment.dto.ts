import { IsBoolean, IsOptional } from 'class-validator';

export class ApproveEquipmentDto {
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;
}

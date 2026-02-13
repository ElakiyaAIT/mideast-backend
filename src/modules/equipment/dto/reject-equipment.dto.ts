import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class RejectEquipmentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  rejectionReason: string;
}

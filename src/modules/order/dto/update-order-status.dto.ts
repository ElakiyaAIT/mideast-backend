import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from '../enums';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsString()
  @IsOptional()
  trackingNumber?: string;

  @IsString()
  @IsOptional()
  adminNotes?: string;
}

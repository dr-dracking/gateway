import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { OrderStatus } from '../interfaces';

export class UpdateOrderDto {
  @IsUUID()
  id: string;

  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;
}

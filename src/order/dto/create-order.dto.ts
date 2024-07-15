import { IsArray, IsNotEmpty } from 'class-validator';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsArray()
  items: CreateOrderItemDto[];
}

import { IsPositive, Min } from 'class-validator';

export class CreateOrderItemDto {
  @IsPositive()
  @Min(1)
  productId: number;

  @IsPositive()
  @Min(1)
  quantity: number;

  @IsPositive()
  @Min(0.01)
  price: number;
}

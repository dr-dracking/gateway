import { IsNotEmpty, IsNumber, IsPositive, MaxLength, MinLength } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @IsPositive()
  @IsNumber({ maxDecimalPlaces: 4 })
  price: number;
}

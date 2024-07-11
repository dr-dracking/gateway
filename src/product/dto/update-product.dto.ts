import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsPositive } from 'class-validator';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsPositive()
  id: number;
}

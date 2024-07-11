import { Module } from '@nestjs/common';
import { RedisModule } from 'src/redis/redis.module';
import { NatsModule } from 'src/transports/nats.module';
import { ProductController } from './product.controller';

@Module({
  controllers: [ProductController],
  imports: [NatsModule, RedisModule],
})
export class ProductModule {}

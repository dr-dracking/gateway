import { Module } from '@nestjs/common';

import { OrderController } from './order.controller';
import { RedisModule } from 'src/redis/redis.module';
import { NatsModule } from 'src/transports/nats.module';

@Module({
  controllers: [OrderController],
  imports: [NatsModule, RedisModule],
})
export class OrderModule {}

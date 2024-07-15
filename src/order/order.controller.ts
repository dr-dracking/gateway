import { Body, Controller, Delete, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, tap } from 'rxjs';
import { Auth, CurrentUser, Role, User } from 'src/auth';
import { PaginationDto } from 'src/common';
import { envs, NATS_SERVICE } from 'src/config';
import { CreateOrderDto, UpdateOrderDto } from './dto';
import { Order } from './interfaces';

@Controller('order')
export class OrderController {
  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get('health')
  health() {
    return this.client.send('order.health', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post()
  @Auth(Role.Admin, Role.Moderator)
  create(@Body() createOrderDto: CreateOrderDto, @User() user: CurrentUser) {
    return this.client.send('order.create', { createOrderDto, user }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
      tap(async (data) => {
        await this.clearOrderListCache();
        await this.setNewOrderCache(data);
      }),
    );
  }

  @Get()
  @Auth(Role.Admin, Role.Moderator)
  async findAll(@Query() paginationDto: PaginationDto, @User() user: CurrentUser) {
    const cacheKey = this.getOrderListCacheKey(paginationDto);
    const cachedItems = await this.cacheManager.get(cacheKey);

    if (cachedItems) return cachedItems;

    return this.client.send('order.find.all', { paginationDto, user }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
      tap(async (data) => await this.cacheManager.set(cacheKey, data, envs.cacheTtl)),
    );
  }

  @Get('clear_cache')
  @Auth(Role.Admin)
  async clearCache() {
    // Clear all cache
    const orderKey = await this.cacheManager.store.keys('order:*');
    for (const key of orderKey) await this.cacheManager.del(key);

    const ordersKeys = await this.cacheManager.store.keys(`orders:*`);
    for (const key of ordersKeys) await this.cacheManager.del(key);

    return 'Cache cleared successfully';
  }

  @Get(':id')
  @Auth(Role.Admin, Role.Moderator)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @User() user: CurrentUser) {
    const cacheKey = `order:${id}`;
    const cachedOrders = await this.cacheManager.get(cacheKey);

    if (cachedOrders) return cachedOrders;

    return this.client.send('order.find.id', { id, user }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),

      tap(async (data) => await this.setNewOrderCache(data)),
    );
  }

  @Patch()
  @Auth(Role.Admin, Role.Moderator)
  async update(@Body() updateOrderDto: UpdateOrderDto, @User() user: CurrentUser) {
    return this.client.send('order.update', { updateOrderDto, user }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
      tap(async (data: Order) => {
        await this.clearOrderListCache();
        await this.setNewOrderCache(data);
      }),
    );
  }

  @Delete(':id')
  @Auth(Role.Admin)
  remove(@Param('id', ParseUUIDPipe) id: string, @User() user: CurrentUser) {
    return this.client.send('order.remove', { id, user }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
      tap(async (data) => {
        await this.clearOrderListCache();
        await this.setNewOrderCache(data);
      }),
    );
  }

  @Patch('restore/:id')
  @Auth(Role.Admin, Role.Moderator)
  restore(@Param('id', ParseUUIDPipe) id: string, @User() user: CurrentUser) {
    return this.client.send('order.restore', { id, user }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
      tap(async (data) => {
        await this.clearOrderListCache();
        await this.setNewOrderCache(data);
      }),
    );
  }

  private getOrderListCacheKey(paginationDto: PaginationDto): string {
    return `products:page:${paginationDto.page}:limit:${paginationDto.limit}`;
  }

  private async clearOrderListCache() {
    const keys = await this.cacheManager.store.keys(`orders:*`);
    for (const key of keys) await this.cacheManager.del(key);
  }

  private async setNewOrderCache(order: Order) {
    await this.cacheManager.set(`order:${order.id}`, order, envs.cacheTtl);
  }
}

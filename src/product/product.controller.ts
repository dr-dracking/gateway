import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, tap } from 'rxjs';
import { Auth, CurrentUser, Role, User } from 'src/auth';
import { PaginationDto } from 'src/common';
import { envs, NATS_SERVICE } from 'src/config';
import { CreateProductDto, UpdateProductDto } from './dto';
import { Product } from './interfaces';

@Controller('product')
export class ProductController {
  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get('health')
  health() {
    return this.client.send('product.health', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post()
  @Auth(Role.Admin, Role.Moderator)
  create(@Body() createProductDto: CreateProductDto, @User() currentUser: CurrentUser) {
    return this.client.send('product.create', { createProductDto, user: currentUser }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
      tap(async (product) => {
        await this.clearProductListCache();
        await this.setNewProductCache(product);
      }),
    );
  }

  @Get()
  @Auth(Role.Admin, Role.Moderator)
  async findAll(@Query() paginationDto: PaginationDto, @User() user: CurrentUser) {
    const cacheKey = this.getProductListCacheKey(paginationDto);
    const cachedProducts = await this.cacheManager.get(cacheKey);

    if (cachedProducts) return cachedProducts;

    return this.client.send('product.find.all', { paginationDto, user }).pipe(
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
    const productKeys = await this.cacheManager.store.keys('product:*');
    for (const key of productKeys) await this.cacheManager.del(key);

    const productsKeys = await this.cacheManager.store.keys(`products:*`);
    for (const key of productsKeys) await this.cacheManager.del(key);

    return 'Cache cleared successfully';
  }

  @Get(':id')
  @Auth(Role.Admin, Role.Moderator)
  async findOne(@Param('id', ParseIntPipe) id: number, @User() user: CurrentUser) {
    const cacheKey = `product:${id}`;
    const cachedProducts = await this.cacheManager.get(cacheKey);

    if (cachedProducts) return cachedProducts;

    return this.client.send('product.find.id', { id, user }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),

      tap(async (data) => await this.setNewProductCache(data)),
    );
  }

  @Patch()
  @Auth(Role.Admin, Role.Moderator)
  async update(@Body() updateProductDto: UpdateProductDto, @User() user: CurrentUser) {
    return this.client.send('product.update', { updateProductDto, user }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
      tap(async (data: Product) => {
        await this.clearProductListCache();
        await this.setNewProductCache(data);
      }),
    );
  }

  @Delete(':id')
  @Auth(Role.Admin)
  remove(@Param('id', ParseIntPipe) id: number, @User() user: CurrentUser) {
    return this.client.send('product.remove', { id, user }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
      tap(async (data: Product) => {
        await this.clearProductListCache();
        await this.setNewProductCache(data);
      }),
    );
  }

  @Patch('restore/:id')
  @Auth(Role.Admin, Role.Moderator)
  restore(@Param('id', ParseIntPipe) id: number, @User() user: CurrentUser) {
    return this.client.send('product.restore', { id, user }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
      tap(async (data: Product) => {
        await this.clearProductListCache();
        await this.setNewProductCache(data);
      }),
    );
  }

  private getProductListCacheKey(paginationDto: PaginationDto): string {
    return `products:page:${paginationDto.page}:limit:${paginationDto.limit}`;
  }

  private async clearProductListCache() {
    const keys = await this.cacheManager.store.keys(`products:*`);
    for (const key of keys) await this.cacheManager.del(key);
  }

  private async setNewProductCache(product: Product) {
    // const newProduct = await firstValueFrom(this.client.send('product.find.id', { id: product.id }));
    await this.cacheManager.set(`product:${product.id}`, product, envs.cacheTtl);
  }
}

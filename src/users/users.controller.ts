import { Body, Controller, Delete, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError, tap } from 'rxjs';
import { Auth, User } from 'src/auth/decorators';
import { CurrentUser, Role } from 'src/auth/interfaces';
import { PaginationDto } from 'src/common';
import { NATS_SERVICE } from 'src/config';
import { CreateUserDto, UpdateUserDto } from './dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

const CACHE_TIME = 8.64e7; // 24 hours

@Controller('users')
export class UsersController {
  constructor(
    @Inject(NATS_SERVICE) private readonly client: ClientProxy,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @Get('health')
  health() {
    return this.client.send('users.health', {}).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Post()
  @Auth(Role.Admin)
  create(@Body() createUserDto: CreateUserDto, @User() currentUser: CurrentUser) {
    return this.client.send('users.create', { ...createUserDto, createdBy: currentUser.id }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get()
  @Auth(Role.Admin, Role.Moderator)
  findAll(@Query() paginationDto: PaginationDto, @User() user: CurrentUser) {
    return this.client.send('users.findAll', { paginationDto, user }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get(':id')
  @Auth(Role.Admin, Role.Moderator)
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const cacheKey = `user_${id}`;
    const cachedUser = await this.cacheManager.get(cacheKey);

    if (cachedUser) return cachedUser;

    return this.client.send('users.find.id', { id }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),

      tap(async (user) => {
        await this.cacheManager.set(cacheKey, user, CACHE_TIME); // 24 hours
      }),
    );
  }

  @Get('username/:username')
  @Auth(Role.Admin, Role.Moderator)
  async findByUsername(@Param('username') username: string) {
    const cachedUser = await this.cacheManager.get(username);

    if (cachedUser) return cachedUser;

    return this.client.send('users.find.username', { username }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),

      tap(async (user) => {
        await this.cacheManager.set(username, user, CACHE_TIME); // 24 hours
      }),
    );
  }

  @Get('email/:email')
  @Auth(Role.Admin, Role.Moderator)
  async findByEmail(@Param('email') email: string) {
    const cacheKey = `user_${email}`;
    const cachedUser = await this.cacheManager.get(cacheKey);

    if (cachedUser) return cachedUser;

    return this.client.send('users.find.email', { email }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),

      tap(async (user) => {
        await this.cacheManager.set(cacheKey, user, CACHE_TIME); // 24 hours
      }),
    );
  }

  @Get('meta/:id')
  @Auth(Role.Admin, Role.Moderator)
  async findMeta(@Param('id', ParseUUIDPipe) id: string) {
    const cacheKey = `user_meta_${id}`;
    const cachedMeta = await this.cacheManager.get(cacheKey);

    if (cachedMeta) return cachedMeta;

    return this.client.send('users.find.meta', { id }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),

      tap(async (meta) => {
        await this.cacheManager.set(cacheKey, meta, CACHE_TIME); // 24 hours
      }),
    );
  }

  @Get('summary/:id')
  @Auth(Role.Admin, Role.Moderator)
  async findSummary(@Param('id', ParseUUIDPipe) id: string) {
    const cacheKey = `user_summary_${id}`;
    const cachedMeta = await this.cacheManager.get(cacheKey);

    if (cachedMeta) return cachedMeta;

    return this.client.send('users.find.summary', { id }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),

      tap(async (meta) => {
        await this.cacheManager.set(cacheKey, meta, CACHE_TIME); // 24 hours
      }),
    );
  }

  @Patch()
  @Auth(Role.Admin, Role.Moderator)
  update(@Body() updateUserDto: UpdateUserDto) {
    return this.client.send('users.update', updateUserDto).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
      tap(async () => {
        await this.removeUserCache(updateUserDto.id);
      }),
    );
  }

  @Delete(':id')
  @Auth(Role.Admin)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.client.send('users.remove', { id }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
      tap(async () => {
        await this.removeUserCache(id);
      }),
    );
  }

  @Patch('restore/:id')
  @Auth(Role.Admin, Role.Moderator)
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.client.send('users.restore', { id }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),

      tap(async () => {
        await this.removeUserCache(id);
      }),
    );
  }

  private async removeUserCache(id: string) {
    await this.cacheManager.del(`user_${id}`);
    await this.cacheManager.del(`user_meta_${id}`);
  }
}

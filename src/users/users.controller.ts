import { Body, Controller, Delete, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { catchError } from 'rxjs';
import { Auth, User } from 'src/auth/decorators';
import { CurrentUser, Role } from 'src/auth/interfaces';
import { PaginationDto } from 'src/common';
import { NATS_SERVICE } from 'src/config';
import { CreateUserDto, UpdateUserDto } from './dto';

@Controller('users')
export class UsersController {
  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {}

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
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.client.send('users.find.id', { id }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('username/:username')
  @Auth(Role.Admin, Role.Moderator)
  findByUsername(@Param('username') username: string) {
    return this.client.send('users.find.username', { username }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('email/:email')
  @Auth(Role.Admin, Role.Moderator)
  findByEmail(@Param('email') email: string) {
    return this.client.send('users.find.email', { email }).pipe(
      catchError((error) => {
        throw new RpcException(error);
      }),
    );
  }

  @Get('meta/:id')
  @Auth(Role.Admin, Role.Moderator)
  findMeta(@Param('id', ParseUUIDPipe) id: string) {
    return this.client.send('users.find.meta', { id }).pipe(
      catchError((error) => {
        throw new RpcException(error);
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
    );
  }

  @Delete(':id')
  @Auth(Role.Admin)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.client.send('users.remove', { id }).pipe(
      catchError((error) => {
        throw new RpcException(error);
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
    );
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserListQueryDto } from './dto/user-list-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';
import { PaginationResultDto } from '@/common/dto/pagination.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, AdminGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.create(createUserDto);
  }

  @Get()
  findAll(@Query() queryDto: UserListQueryDto): Promise<PaginationResultDto<UserResponseDto>> {
    return this.userService.findAll(queryDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }

  @Patch(':id/restore')
  restore(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.restore(id);
  }

  @Post(':id/verify')
  verify(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.verify(id);
  }

  @Post(':id/suspend')
  suspend(@Param('id') id: string, @Body('reason') reason: string): Promise<UserResponseDto> {
    return this.userService.suspend(id, reason);
  }

  @Post(':id/block')
  block(@Param('id') id: string, @Body('reason') reason: string): Promise<UserResponseDto> {
    return this.userService.block(id, reason);
  }
}

import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { SelfUserGuard } from './guard/self-user.guard';
import type { GetUsersResult } from './types/user-list.type';
import type { GetUserProfileResult } from './types/user-profile.type';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers(@Query() query: GetUsersQueryDto): Promise<ApiSuccessResponse<GetUsersResult>> {
    const result = await this.usersService.getUsers(query);
    return createSuccessResponse('유저 목록 조회 성공', result);
  }

  @Get(':userId/profiles')
  async getUserProfile(@Param('userId') userId: string): Promise<ApiSuccessResponse<GetUserProfileResult>> {
    const result = await this.usersService.getUserProfile(userId);
    return createSuccessResponse('유저 프로필 조회 성공', result);
  }

  @Patch(':userId/profiles')
  @UseGuards(AccessTokenGuard, SelfUserGuard)
  async updateUserProfile(@Param('userId') userId: string, @Body() dto: UpdateUserProfileDto): Promise<ApiSuccessResponse<GetUserProfileResult>> {
    const result = await this.usersService.updateUserProfile(userId, dto);
    return createSuccessResponse('유저 프로필 수정 성공', result);
  }
}

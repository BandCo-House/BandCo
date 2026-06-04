import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { SelfUserGuard } from './guard/self-user.guard';
import type { GetUsersResult } from './types/user-list.type';
import type { GetUserProfileResult } from './types/user-profile.type';
import { UsersService } from './users.service';

@ApiTags('유저')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: '유저 목록 조회' })
  @ApiResponse({ status: 200, description: '유저 목록 조회 성공' })
  async getUsers(@Query() query: GetUsersQueryDto): Promise<ApiSuccessResponse<GetUsersResult>> {
    const result = await this.usersService.getUsers(query);
    return createSuccessResponse('유저 목록 조회 성공', result);
  }

  @Get(':userId/profiles')
  @ApiOperation({ summary: '유저 프로필 조회' })
  @ApiParam({ name: 'userId', description: '유저 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '유저 프로필 조회 성공' })
  @ApiResponse({ status: 404, description: '유저를 찾을 수 없음' })
  async getUserProfile(@Param('userId') userId: string): Promise<ApiSuccessResponse<GetUserProfileResult>> {
    const result = await this.usersService.getUserProfile(userId);
    return createSuccessResponse('유저 프로필 조회 성공', result);
  }

  @Patch(':userId/profiles')
  @UseGuards(AccessTokenGuard, SelfUserGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '유저 프로필 수정' })
  @ApiParam({ name: 'userId', description: '유저 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '유저 프로필 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '본인 프로필만 수정 가능' })
  @ApiResponse({ status: 404, description: '유저를 찾을 수 없음' })
  async updateUserProfile(@Param('userId') userId: string, @Body() dto: UpdateUserProfileDto): Promise<ApiSuccessResponse<GetUserProfileResult>> {
    const result = await this.usersService.updateUserProfile(userId, dto);
    return createSuccessResponse('유저 프로필 수정 성공', result);
  }
}

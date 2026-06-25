import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { SelfUserGuard } from './guard/self-user.guard';
import type { DeleteUserResult } from './repositoreis/user.repository';
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
  @ApiResponse({ status: 400, description: '유효성 검사 실패 (take 범위, order 값, cursor__id UUID 형식)' })
  async getUsers(@Query() query: GetUsersQueryDto): Promise<ApiSuccessResponse<GetUsersResult>> {
    const result = await this.usersService.getUsers(query);
    return createSuccessResponse('유저 목록 조회 성공', result);
  }

  @Get(':userId/profiles')
  @ApiOperation({ summary: '유저 프로필 조회' })
  @ApiParam({ name: 'userId', description: '유저 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '유저 프로필 조회 성공' })
  @ApiResponse({ status: 400, description: 'userId가 UUID 형식이 아님' })
  @ApiResponse({ status: 404, description: '존재하지 않는 유저' })
  async getUserProfile(@Param('userId', ParseUUIDPipe) userId: string): Promise<ApiSuccessResponse<GetUserProfileResult>> {
    const result = await this.usersService.getUserProfile(userId);
    return createSuccessResponse('유저 프로필 조회 성공', result);
  }

  @Delete(':userId')
  @UseGuards(AccessTokenGuard, SelfUserGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '회원 탈퇴' })
  @ApiParam({ name: 'userId', description: '유저 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '회원 탈퇴 성공' })
  @ApiResponse({ status: 400, description: 'userId가 UUID 형식이 아님' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '본인 계정만 탈퇴 가능' })
  @ApiResponse({ status: 404, description: '존재하지 않는 유저' })
  async deleteUser(@Param('userId', ParseUUIDPipe) userId: string): Promise<ApiSuccessResponse<DeleteUserResult>> {
    const result = await this.usersService.deleteUser(userId);
    return createSuccessResponse('회원 탈퇴가 완료되었습니다.', result);
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

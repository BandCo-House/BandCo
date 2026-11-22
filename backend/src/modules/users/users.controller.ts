import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { ChangeHandleDto } from './dto/change-handle.dto';
import { CheckHandleQueryDto } from './dto/check-handle-query.dto';
import { GetUsersQueryDto } from './dto/get-users-query.dto';
import { SearchProfileMusicQueryDto } from './dto/search-profile-music-query.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { SelfUserGuard } from './guard/self-user.guard';
import type { AuthUser, DeleteUserResult } from './repositoreis/user.repository';
import type { DeleteProfileMusicResult, ProfileMusicTrack } from './types/profile-music.type';
import type { ChangeHandleResult, HandleAvailabilityResult } from './types/user-handle.type';
import type { GetUsersResult } from './types/user-list.type';
import type { GetUserProfileResult } from './types/user-profile.type';
import { UsersService } from './users.service';

interface AuthenticatedRequest {
  user: AuthUser;
}

@ApiTags('유저')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '유저 목록 조회' })
  @ApiResponse({ status: 200, description: '유저 목록 조회 성공' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패 (take 범위, order 값, cursor__id UUID 형식)' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getUsers(@Query() query: GetUsersQueryDto): Promise<ApiSuccessResponse<GetUsersResult>> {
    const result = await this.usersService.getUsers(query);
    return createSuccessResponse('유저 목록 조회 성공', result);
  }

  // profile-music/search는 :userId 라우트보다 위에 선언해야 NestJS가 profile-music을 userId로 오인하지 않는다
  @Get('profile-music/search')
  @ApiOperation({ summary: '프로필 음악 검색 (#68)' })
  @ApiResponse({ status: 200, description: '프로필 음악 검색 성공' })
  @ApiResponse({ status: 400, description: '검색어(q) 누락' })
  async searchProfileMusic(@Query() query: SearchProfileMusicQueryDto): Promise<ApiSuccessResponse<{ items: ProfileMusicTrack[] }>> {
    const result = await this.usersService.searchProfileMusic(query.q);
    return createSuccessResponse('프로필 음악 검색 성공', result);
  }

  // 비로그인 중복 확인은 고유 ID 전수 열거 창구가 되므로 인증을 요구한다
  @Get('handles/availability')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '고유 ID 중복 확인 (#71)' })
  @ApiResponse({ status: 200, description: '확인 성공 (available로 사용 가능 여부 반환, 본인이 쓰는 값이면 true)' })
  @ApiResponse({ status: 400, description: '고유 ID 형식 오류 (영문 대소문자·숫자·_ 4~8자)' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async checkHandleAvailability(
    @Req() request: AuthenticatedRequest,
    @Query() query: CheckHandleQueryDto,
  ): Promise<ApiSuccessResponse<HandleAvailabilityResult>> {
    const result = await this.usersService.checkHandleAvailability(query.handle, request.user.id);
    return createSuccessResponse('고유 ID 확인 성공', result);
  }

  @Patch(':userId/handle')
  @UseGuards(AccessTokenGuard, SelfUserGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '고유 ID 변경 (#72, 7일에 1회, 처음 설정은 제외)' })
  @ApiParam({ name: 'userId', description: '유저 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '고유 ID 변경 성공' })
  @ApiResponse({ status: 400, description: '형식 오류, 이미 사용 중인 고유 ID, 7일 쿨다운 미경과, 동시 변경 충돌' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '본인 고유 ID만 변경 가능' })
  @ApiResponse({ status: 404, description: '존재하지 않는 유저' })
  async changeHandle(@Param('userId', ParseUUIDPipe) userId: string, @Body() dto: ChangeHandleDto): Promise<ApiSuccessResponse<ChangeHandleResult>> {
    const result = await this.usersService.changeHandle(userId, dto.handle);
    return createSuccessResponse('고유 ID 변경 성공', result);
  }

  @Get(':userId/profiles')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '유저 프로필 조회' })
  @ApiParam({ name: 'userId', description: '유저 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '유저 프로필 조회 성공 (email은 본인 조회 시에만 포함)' })
  @ApiResponse({ status: 400, description: 'userId가 UUID 형식이 아님' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '존재하지 않는 유저' })
  async getUserProfile(
    @Req() request: AuthenticatedRequest,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ApiSuccessResponse<GetUserProfileResult>> {
    const result = await this.usersService.getUserProfile(userId, request.user.id);
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

  @Delete(':userId/profile-music')
  @UseGuards(AccessTokenGuard, SelfUserGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '프로필 음악 삭제 (#69)' })
  @ApiParam({ name: 'userId', description: '유저 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '프로필 음악 삭제 성공' })
  @ApiResponse({ status: 400, description: 'userId가 UUID 형식이 아님' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '본인 프로필 음악만 삭제 가능' })
  @ApiResponse({ status: 404, description: '프로필 음악이 존재하지 않음' })
  async deleteProfileMusic(@Param('userId', ParseUUIDPipe) userId: string): Promise<ApiSuccessResponse<DeleteProfileMusicResult>> {
    const result = await this.usersService.deleteProfileMusic(userId);
    return createSuccessResponse('프로필 음악 삭제 성공', result);
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

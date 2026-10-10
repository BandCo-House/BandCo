import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse, createSuccessResponse } from 'src/common/api-response';

import { CurrentAdmin } from '../core/decorator/current-admin.decorator';
import { AdminPaginationQueryDto } from '../core/dto/admin-pagination-query.dto';
import { AdminRolesGuard } from '../core/guard/admin-roles.guard';
import { AdminAccessTokenGuard } from '../core/guard/admin-token.guard';
import type { AdminPaginatedResult } from '../core/types/admin-paginated.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import { SendAdminNoticeDto } from './dto/admin-notifications.dto';
import { CreateAdminSanctionDto } from './dto/admin-sanctions.dto';
import { GetAdminUsersQueryDto, UpdateAdminUserStatusDto, WithdrawAdminUserDto } from './dto/admin-users.dto';
import type { AdminNotification, AdminNotificationIdResult } from './types/admin-notification.type';
import type { AdminSanction } from './types/admin-sanction.type';
import type {
  AdminUserDetail,
  AdminUserListItem,
  RestoreAdminUserResult,
  UpdateAdminUserStatusResult,
  WithdrawAdminUserResult,
} from './types/admin-user.type';
import { AdminNotificationsService } from './admin-notifications.service';
import { AdminSanctionsService } from './admin-sanctions.service';
import { AdminUsersService } from './admin-users.service';

@ApiTags('어드민 - 회원')
@ApiBearerAuth('admin-access-token')
@UseGuards(AdminAccessTokenGuard, AdminRolesGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(
    private readonly adminUsersService: AdminUsersService,
    private readonly adminNotificationsService: AdminNotificationsService,
    private readonly adminSanctionsService: AdminSanctionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: '회원 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 400, description: '잘못된 필터' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getUsers(@Query() query: GetAdminUsersQueryDto): Promise<ApiSuccessResponse<AdminPaginatedResult<AdminUserListItem>>> {
    const { page, size, ...filter } = query;
    const result = await this.adminUsersService.getUsers(filter, { page, size });
    return createSuccessResponse('회원 목록 조회 완료', result);
  }

  @Get(':userId')
  @ApiOperation({ summary: '회원 상세 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '회원 없음' })
  async getUserDetail(@Param('userId', ParseUUIDPipe) userId: string): Promise<ApiSuccessResponse<AdminUserDetail>> {
    const result = await this.adminUsersService.getUserDetail(userId);
    return createSuccessResponse('회원 상세 조회 완료', result);
  }

  @Patch(':userId/status')
  @ApiOperation({ summary: '회원 상태 변경' })
  @ApiResponse({ status: 200, description: '변경 성공' })
  @ApiResponse({ status: 400, description: '탈퇴 회원이거나 이미 같은 상태' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '회원 없음' })
  async updateUserStatus(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateAdminUserStatusDto,
  ): Promise<ApiSuccessResponse<UpdateAdminUserStatusResult>> {
    const result = await this.adminUsersService.updateUserStatus(admin, userId, dto);
    return createSuccessResponse('회원 상태 변경 완료', result);
  }

  @Post(':userId/withdraw')
  @ApiOperation({ summary: '회원 탈퇴 처리' })
  @ApiResponse({ status: 201, description: '탈퇴 처리 성공' })
  @ApiResponse({ status: 400, description: '이미 탈퇴한 회원' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '회원 없음' })
  async withdrawUser(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: WithdrawAdminUserDto,
  ): Promise<ApiSuccessResponse<WithdrawAdminUserResult>> {
    const result = await this.adminUsersService.withdrawUser(admin, userId, dto.reason);
    return createSuccessResponse('회원 탈퇴 처리 완료', result);
  }

  @Post(':userId/restore')
  @ApiOperation({ summary: '탈퇴 회원 복구' })
  @ApiResponse({ status: 201, description: '복구 성공' })
  @ApiResponse({ status: 400, description: '탈퇴하지 않은 회원' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '회원 없음' })
  async restoreUser(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<ApiSuccessResponse<RestoreAdminUserResult>> {
    const result = await this.adminUsersService.restoreUser(admin, userId);
    return createSuccessResponse('회원 복구 완료', result);
  }

  @Get(':userId/notifications')
  @ApiOperation({ summary: '회원 알림 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '회원 없음' })
  async getUserNotifications(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: AdminPaginationQueryDto,
  ): Promise<ApiSuccessResponse<AdminPaginatedResult<AdminNotification>>> {
    const result = await this.adminNotificationsService.getUserNotifications(userId, { page: query.page, size: query.size });
    return createSuccessResponse('회원 알림 목록 조회 완료', result);
  }

  @Post(':userId/notifications')
  @ApiOperation({ summary: '회원에게 공지 알림 발송' })
  @ApiResponse({ status: 201, description: '발송 성공' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '회원 없음 또는 탈퇴' })
  async sendNotice(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: SendAdminNoticeDto,
  ): Promise<ApiSuccessResponse<AdminNotificationIdResult>> {
    const result = await this.adminNotificationsService.sendNotice(admin, userId, dto);
    return createSuccessResponse('알림 발송 완료', result);
  }

  @Get(':userId/sanctions')
  @ApiOperation({ summary: '회원 제재 이력 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '회원 없음' })
  async getUserSanctions(@Param('userId', ParseUUIDPipe) userId: string): Promise<ApiSuccessResponse<{ sanctions: AdminSanction[] }>> {
    const result = await this.adminSanctionsService.getUserSanctions(userId);
    return createSuccessResponse('회원 제재 이력 조회 완료', result);
  }

  @Post(':userId/sanctions')
  @ApiOperation({ summary: '회원 제재(경고·이용 정지)' })
  @ApiResponse({ status: 201, description: '제재 성공' })
  @ApiResponse({ status: 400, description: '경고에 종료 시각 지정 또는 지난 종료 시각' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '회원 없음 또는 탈퇴' })
  @ApiResponse({ status: 409, description: '이미 이용 정지 중' })
  async createSanction(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: CreateAdminSanctionDto,
  ): Promise<ApiSuccessResponse<AdminSanction>> {
    const result = await this.adminSanctionsService.createSanction(admin, userId, dto);
    return createSuccessResponse('회원 제재 완료', result);
  }
}

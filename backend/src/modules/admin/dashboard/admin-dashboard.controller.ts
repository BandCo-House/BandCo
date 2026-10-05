import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse, createSuccessResponse } from 'src/common/api-response';

import { AdminRolesGuard } from '../core/guard/admin-roles.guard';
import { AdminAccessTokenGuard } from '../core/guard/admin-token.guard';

import { GetAdminDashboardFunnelQueryDto } from './dto/get-admin-dashboard-funnel-query.dto';
import { GetAdminDashboardSignupsQueryDto } from './dto/get-admin-dashboard-signups-query.dto';
import type { AdminDashboardFunnel, AdminDashboardSignups, AdminDashboardStorage, AdminDashboardSummary } from './types/admin-dashboard.type';
import { AdminDashboardService } from './admin-dashboard.service';

@ApiTags('어드민 - 대시보드')
@ApiBearerAuth('admin-access-token')
@UseGuards(AdminAccessTokenGuard, AdminRolesGuard)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: '대시보드 요약 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getSummary(): Promise<ApiSuccessResponse<AdminDashboardSummary>> {
    const result = await this.dashboardService.getSummary();
    return createSuccessResponse('대시보드 요약 조회 완료', result);
  }

  @Get('signups')
  @ApiOperation({ summary: '일별 가입 추이 조회 (KST)' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 400, description: 'days가 1~180 범위 밖' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getSignups(@Query() query: GetAdminDashboardSignupsQueryDto): Promise<ApiSuccessResponse<AdminDashboardSignups>> {
    const result = await this.dashboardService.getSignups(query.days);
    return createSuccessResponse('가입 추이 조회 완료', result);
  }

  @Get('funnel')
  @ApiOperation({ summary: '가입 코호트 퍼널 조회 (KST)' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 400, description: '날짜 형식 오류, 시작일이 종료일보다 늦음, 기간 366일 초과' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getFunnel(@Query() query: GetAdminDashboardFunnelQueryDto): Promise<ApiSuccessResponse<AdminDashboardFunnel>> {
    const result = await this.dashboardService.getFunnel({ from: query.from, to: query.to });
    return createSuccessResponse('퍼널 조회 완료', result);
  }

  @Get('storage')
  @ApiOperation({ summary: '스토리지 사용량 조회 (S3 버킷 전체 스캔)' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getStorage(): Promise<ApiSuccessResponse<AdminDashboardStorage>> {
    const result = await this.dashboardService.getStorage();
    return createSuccessResponse('스토리지 사용량 조회 완료', result);
  }
}

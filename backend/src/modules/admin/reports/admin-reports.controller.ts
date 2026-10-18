import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse, createSuccessResponse } from 'src/common/api-response';

import { CurrentAdmin } from '../core/decorator/current-admin.decorator';
import { AdminRolesGuard } from '../core/guard/admin-roles.guard';
import { AdminAccessTokenGuard } from '../core/guard/admin-token.guard';
import type { AdminPaginatedResult } from '../core/types/admin-paginated.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import { GetAdminReportsQueryDto } from './dto/get-admin-reports-query.dto';
import { ResolveAdminReportDto } from './dto/resolve-admin-report.dto';
import type { AdminReport } from './types/admin-report.type';
import { AdminReportsService } from './admin-reports.service';

@ApiTags('어드민 - 신고')
@ApiBearerAuth('admin-access-token')
@UseGuards(AdminAccessTokenGuard, AdminRolesGuard)
@Controller('admin/reports')
export class AdminReportsController {
  constructor(private readonly adminReportsService: AdminReportsService) {}

  @Get()
  @ApiOperation({ summary: '신고 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 400, description: '잘못된 필터·페이지 값' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getReports(@Query() query: GetAdminReportsQueryDto): Promise<ApiSuccessResponse<AdminPaginatedResult<AdminReport>>> {
    const { page, size, status } = query;
    const result = await this.adminReportsService.getReports({ status }, { page, size });
    return createSuccessResponse('신고 목록 조회 완료', result);
  }

  @Get(':reportId')
  @ApiOperation({ summary: '신고 상세 조회' })
  @ApiParam({ name: 'reportId', description: '신고 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 400, description: 'reportId가 UUID 형식이 아님' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '신고 없음' })
  async getReport(@Param('reportId', ParseUUIDPipe) reportId: string): Promise<ApiSuccessResponse<AdminReport>> {
    const result = await this.adminReportsService.getReport(reportId);
    return createSuccessResponse('신고 조회 완료', result);
  }

  @Patch(':reportId')
  @ApiOperation({ summary: '신고 처리(처리 완료·기각)' })
  @ApiParam({ name: 'reportId', description: '신고 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '처리 성공' })
  @ApiResponse({ status: 400, description: '유효성 검사 실패 또는 이미 처리된 신고' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '신고 없음' })
  async resolveReport(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('reportId', ParseUUIDPipe) reportId: string,
    @Body() dto: ResolveAdminReportDto,
  ): Promise<ApiSuccessResponse<AdminReport>> {
    const result = await this.adminReportsService.resolveReport(admin, reportId, dto);
    return createSuccessResponse('신고 처리 완료', result);
  }
}

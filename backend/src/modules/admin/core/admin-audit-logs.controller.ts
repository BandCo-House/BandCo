import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse, createSuccessResponse } from 'src/common/api-response';

import { GetAdminAuditLogsQueryDto } from './dto/get-admin-audit-logs-query.dto';
import { AdminRolesGuard } from './guard/admin-roles.guard';
import { AdminAccessTokenGuard } from './guard/admin-token.guard';
import type { AdminAuditLogListItem } from './types/admin-audit.type';
import type { AdminPaginatedResult } from './types/admin-paginated.type';
import { AdminAuditLogsService } from './admin-audit-logs.service';

@ApiTags('어드민 - 감사 로그')
@ApiBearerAuth('admin-access-token')
@UseGuards(AdminAccessTokenGuard, AdminRolesGuard)
@Controller('admin/audit-logs')
export class AdminAuditLogsController {
  constructor(private readonly auditLogsService: AdminAuditLogsService) {}

  @Get()
  @ApiOperation({ summary: '감사 로그 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 400, description: '잘못된 필터' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getAuditLogs(@Query() query: GetAdminAuditLogsQueryDto): Promise<ApiSuccessResponse<AdminPaginatedResult<AdminAuditLogListItem>>> {
    const { page, size, ...filter } = query;
    const result = await this.auditLogsService.getAuditLogs(filter, { page, size });
    return createSuccessResponse('감사 로그 조회 완료', result);
  }
}

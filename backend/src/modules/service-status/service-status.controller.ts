import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse, createSuccessResponse } from 'src/common/api-response';

import type { ActiveAnnouncement, ServiceStatus } from './types/service-status.type';
import { ServiceStatusService } from './service-status.service';

/** 인증 없이 여는 공개 API. 점검 중에도 막히지 않는다. */
@ApiTags('서비스 상태')
@Controller()
export class ServiceStatusController {
  constructor(private readonly serviceStatusService: ServiceStatusService) {}

  @Get('service-status')
  @ApiOperation({ summary: '서비스 상태 조회 (점검 여부·최소 앱 버전)' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getServiceStatus(): Promise<ApiSuccessResponse<ServiceStatus>> {
    const result = await this.serviceStatusService.getServiceStatus();
    return createSuccessResponse('서비스 상태 조회 완료', result);
  }

  @Get('announcements/active')
  @ApiOperation({ summary: '노출 중인 공지 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  async getActiveAnnouncements(): Promise<ApiSuccessResponse<{ announcements: ActiveAnnouncement[] }>> {
    const result = await this.serviceStatusService.getActiveAnnouncements();
    return createSuccessResponse('공지 조회 완료', result);
  }
}

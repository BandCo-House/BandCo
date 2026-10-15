import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type ApiSuccessResponse, createSuccessResponse } from 'src/common/api-response';

import { CurrentAdmin } from '../core/decorator/current-admin.decorator';
import { AdminRolesGuard } from '../core/guard/admin-roles.guard';
import { AdminAccessTokenGuard } from '../core/guard/admin-token.guard';
import type { AdminPaginatedResult } from '../core/types/admin-paginated.type';
import type { AdminPrincipal } from '../core/types/admin-principal.type';

import { GetAdminBandsQueryDto } from './dto/get-admin-bands-query.dto';
import { TransferBandMasterDto } from './dto/transfer-band-master.dto';
import type {
  AdminBandDetail,
  AdminBandListItem,
  DeleteBandResult,
  ExpireBandInviteLinkResult,
  RestoreBandResult,
  TransferBandMasterResult,
} from './types/admin-band.type';
import { AdminBandsService } from './admin-bands.service';

@ApiTags('어드민 - 밴드')
@ApiBearerAuth('admin-access-token')
@UseGuards(AdminAccessTokenGuard, AdminRolesGuard)
@Controller('admin/bands')
export class AdminBandsController {
  constructor(private readonly adminBandsService: AdminBandsService) {}

  @Get()
  @ApiOperation({ summary: '밴드 목록 조회' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 400, description: '잘못된 쿼리' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  async getBands(@Query() query: GetAdminBandsQueryDto): Promise<ApiSuccessResponse<AdminPaginatedResult<AdminBandListItem>>> {
    const { page, size, keyword, includeDeleted } = query;
    const result = await this.adminBandsService.getBands({ keyword, includeDeleted }, { page, size });
    return createSuccessResponse('밴드 목록 조회 완료', result);
  }

  @Get(':bandId')
  @ApiOperation({ summary: '밴드 상세 조회 (삭제된 밴드 포함)' })
  @ApiResponse({ status: 200, description: '조회 성공' })
  @ApiResponse({ status: 400, description: '잘못된 밴드 ID' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '밴드 없음' })
  async getBand(@Param('bandId', ParseUUIDPipe) bandId: string): Promise<ApiSuccessResponse<AdminBandDetail>> {
    const result = await this.adminBandsService.getBand(bandId);
    return createSuccessResponse('밴드 상세 조회 완료', result);
  }

  @Patch(':bandId/master')
  @ApiOperation({ summary: '밴드장 이전' })
  @ApiResponse({ status: 200, description: '이전 성공' })
  @ApiResponse({ status: 400, description: '멤버가 아니거나 이미 밴드장인 유저' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '밴드 없음 또는 삭제됨' })
  async transferBandMaster(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('bandId', ParseUUIDPipe) bandId: string,
    @Body() dto: TransferBandMasterDto,
  ): Promise<ApiSuccessResponse<TransferBandMasterResult>> {
    const result = await this.adminBandsService.transferBandMaster(admin, bandId, dto.userId);
    return createSuccessResponse('밴드장 이전 완료', result);
  }

  @Post(':bandId/invite-link/expire')
  @ApiOperation({ summary: '밴드 초대 링크 즉시 만료' })
  @ApiResponse({ status: 201, description: '만료 성공' })
  @ApiResponse({ status: 400, description: '활성 초대 링크 없음' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '밴드 없음 또는 삭제됨' })
  async expireBandInviteLink(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('bandId', ParseUUIDPipe) bandId: string,
  ): Promise<ApiSuccessResponse<ExpireBandInviteLinkResult>> {
    const result = await this.adminBandsService.expireBandInviteLink(admin, bandId);
    return createSuccessResponse('밴드 초대 링크 만료 완료', result);
  }

  @Delete(':bandId')
  @ApiOperation({ summary: '밴드 삭제 (soft delete)' })
  @ApiResponse({ status: 200, description: '삭제 성공' })
  @ApiResponse({ status: 400, description: '이미 삭제된 밴드' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '밴드 없음' })
  async deleteBand(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('bandId', ParseUUIDPipe) bandId: string,
  ): Promise<ApiSuccessResponse<DeleteBandResult>> {
    const result = await this.adminBandsService.deleteBand(admin, bandId);
    return createSuccessResponse('밴드 삭제 완료', result);
  }

  @Post(':bandId/restore')
  @ApiOperation({ summary: '삭제된 밴드 복구' })
  @ApiResponse({ status: 201, description: '복구 성공' })
  @ApiResponse({ status: 400, description: '삭제되지 않은 밴드' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 404, description: '밴드 없음' })
  async restoreBand(
    @CurrentAdmin() admin: AdminPrincipal,
    @Param('bandId', ParseUUIDPipe) bandId: string,
  ): Promise<ApiSuccessResponse<RestoreBandResult>> {
    const result = await this.adminBandsService.restoreBand(admin, bandId);
    return createSuccessResponse('밴드 복구 완료', result);
  }
}

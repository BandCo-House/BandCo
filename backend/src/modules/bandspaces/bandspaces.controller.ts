import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { AuthUser } from '../users/repositoreis/user.repository';

import { AddBandSpaceMemberBodyDto } from './dto/add-bandspace-member.dto';
import { CreateBandSpaceBodyDto } from './dto/create-band-space.dto';
import { GetBandSpacesQueryDto } from './dto/get-band-spaces-query.dto';
import { UpdateBandSpaceBodyDto } from './dto/update-band-space.dto';
import { UpdateBandSpaceMemberRoleBodyDto } from './dto/update-bandspace-member-role.dto';
import type { AddBandSpaceMemberResult } from './types/add-bandspace-member-result.type';
import type { GetBandSpacesResult } from './types/band-space-list-item.type';
import type { GetBandSpaceDetailResult } from './types/bandspace-detail.type';
import type { CreateBandSpaceResult } from './types/create-band-space-result.type';
import type { DeleteBandSpaceResult } from './types/delete-band-space-result.type';
import type { RemoveBandSpaceMemberResult } from './types/remove-bandspace-member-result.type';
import type { UpdateBandSpaceResult } from './types/update-band-space-result.type';
import type { UpdateBandSpaceMemberRoleResult } from './types/update-bandspace-member-role-result.type';
import { BandSpacesService } from './bandspaces.service';

interface AuthenticatedRequest {
  user: AuthUser;
}

@ApiTags('합주 공간')
@ApiBearerAuth('access-token')
@UseGuards(AccessTokenGuard)
@Controller()
export class BandSpacesController {
  constructor(private readonly bandSpacesService: BandSpacesService) {}

  @Post('bandspaces/:bandspaceId/members')
  @ApiOperation({ summary: '합주 공간 멤버 추가 (#30)' })
  @ApiResponse({ status: 201, description: '합주 공간 멤버 추가 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 403, description: '해당 밴드의 멤버가 아님' })
  @ApiResponse({ status: 404, description: '합주 공간 또는 추가할 밴드 멤버를 찾을 수 없음' })
  @ApiResponse({ status: 409, description: '이미 참여 중인 멤버' })
  async addBandSpaceMember(
    @Req() request: AuthenticatedRequest,
    @Param('bandspaceId') bandspaceId: string,
    @Body() input: AddBandSpaceMemberBodyDto,
  ): Promise<ApiSuccessResponse<AddBandSpaceMemberResult>> {
    const createdMember = await this.bandSpacesService.addBandSpaceMember(bandspaceId, request.user.id, input);

    return createSuccessResponse('합주 공간 멤버 추가 성공', createdMember);
  }

  @Post('bands/:bandId/bandspaces')
  @ApiOperation({ summary: '합주 공간 생성 (#33)' })
  @ApiResponse({ status: 201, description: '합주 공간 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 403, description: '해당 밴드의 멤버가 아님' })
  @ApiResponse({ status: 404, description: '밴드를 찾을 수 없음' })
  async createBandSpace(
    @Req() request: AuthenticatedRequest,
    @Param('bandId') bandId: string,
    @Body() input: CreateBandSpaceBodyDto,
  ): Promise<ApiSuccessResponse<CreateBandSpaceResult>> {
    const createdSpace = await this.bandSpacesService.createBandSpace(bandId, request.user.id, input);

    return createSuccessResponse('합주 공간 생성 성공', createdSpace);
  }

  @Get('bands/:bandId/bandspaces')
  @ApiOperation({ summary: '합주 공간 목록 조회 (#28)' })
  @ApiResponse({ status: 200, description: '합주 공간 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 403, description: '해당 밴드의 멤버가 아님' })
  @ApiResponse({ status: 404, description: '밴드를 찾을 수 없음' })
  async getBandSpaces(
    @Req() request: AuthenticatedRequest,
    @Param('bandId') bandId: string,
    @Query() query: GetBandSpacesQueryDto,
  ): Promise<ApiSuccessResponse<GetBandSpacesResult>> {
    const spaces = await this.bandSpacesService.getBandSpaces(bandId, request.user.id, query);

    return createSuccessResponse('합주 공간 목록 조회 성공', spaces);
  }

  @Get('bandspaces/:bandspaceId')
  @ApiOperation({ summary: '합주 공간 상세 조회 (#29)' })
  @ApiResponse({ status: 200, description: '합주 공간 상세 조회 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 403, description: '해당 밴드의 멤버가 아님' })
  @ApiResponse({ status: 404, description: '합주 공간을 찾을 수 없음' })
  async getBandSpaceDetail(
    @Req() request: AuthenticatedRequest,
    @Param('bandspaceId') bandspaceId: string,
  ): Promise<ApiSuccessResponse<GetBandSpaceDetailResult>> {
    const spaceDetail = await this.bandSpacesService.getBandSpaceDetail(bandspaceId, request.user.id);

    return createSuccessResponse('합주 공간 상세 조회 성공', spaceDetail);
  }

  @Patch('bandspaces/:bandspaceId')
  @ApiOperation({ summary: '합주 공간 수정 (#57)' })
  @ApiResponse({ status: 200, description: '합주 공간 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 403, description: '해당 밴드의 멤버가 아님' })
  @ApiResponse({ status: 404, description: '합주 공간을 찾을 수 없음' })
  async updateBandSpace(
    @Req() request: AuthenticatedRequest,
    @Param('bandspaceId') bandspaceId: string,
    @Body() input: UpdateBandSpaceBodyDto,
  ): Promise<ApiSuccessResponse<UpdateBandSpaceResult>> {
    const updatedSpace = await this.bandSpacesService.updateBandSpace(bandspaceId, request.user.id, input);

    return createSuccessResponse('합주 공간 수정 성공', updatedSpace);
  }

  @Delete('bandspaces/:bandspaceId')
  @ApiOperation({ summary: '합주 공간 삭제 (#58)' })
  @ApiResponse({ status: 200, description: '합주 공간 삭제 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 403, description: '해당 밴드의 멤버가 아님' })
  @ApiResponse({ status: 404, description: '합주 공간을 찾을 수 없음' })
  async deleteBandSpace(
    @Req() request: AuthenticatedRequest,
    @Param('bandspaceId') bandspaceId: string,
  ): Promise<ApiSuccessResponse<DeleteBandSpaceResult>> {
    const deletedSpace = await this.bandSpacesService.deleteBandSpace(bandspaceId, request.user.id);

    return createSuccessResponse('합주 공간 삭제 성공', deletedSpace);
  }

  @Patch('bandspaces/:bandspaceId/members/:memberId')
  @ApiOperation({ summary: '합주 공간 멤버 역할 수정 (#31)' })
  @ApiResponse({ status: 200, description: '합주 공간 멤버 역할 수정 성공' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 403, description: '해당 밴드의 멤버가 아님' })
  @ApiResponse({ status: 404, description: '합주 공간 또는 멤버를 찾을 수 없음' })
  async updateBandSpaceMemberRole(
    @Req() request: AuthenticatedRequest,
    @Param('bandspaceId') bandspaceId: string,
    @Param('memberId') memberId: string,
    @Body() input: UpdateBandSpaceMemberRoleBodyDto,
  ): Promise<ApiSuccessResponse<UpdateBandSpaceMemberRoleResult>> {
    const updatedMember = await this.bandSpacesService.updateBandSpaceMemberRole(bandspaceId, request.user.id, memberId, input);

    return createSuccessResponse('합주 공간 멤버 역할 수정 성공', updatedMember);
  }

  @Delete('bandspaces/:bandspaceId/members/:memberId')
  @ApiOperation({ summary: '합주 공간 멤버 제거 (#32)' })
  @ApiResponse({ status: 200, description: '합주 공간 멤버 제거 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 요청' })
  @ApiResponse({ status: 403, description: '해당 밴드의 멤버가 아님' })
  @ApiResponse({ status: 404, description: '합주 공간 또는 멤버를 찾을 수 없음' })
  async removeBandSpaceMember(
    @Req() request: AuthenticatedRequest,
    @Param('bandspaceId') bandspaceId: string,
    @Param('memberId') memberId: string,
  ): Promise<ApiSuccessResponse<RemoveBandSpaceMemberResult>> {
    const removedMember = await this.bandSpacesService.removeBandSpaceMember(bandspaceId, request.user.id, memberId);

    return createSuccessResponse('합주 공간 멤버 제거 성공', removedMember);
  }
}

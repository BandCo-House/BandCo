import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

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

@Controller()
export class BandSpacesController {
  constructor(private readonly bandSpacesService: BandSpacesService) {}

  @Post('bandspaces/:bandspaceId/members')
  async addBandSpaceMember(
    @Param('bandspaceId') bandspaceId: string,
    @Body() input: AddBandSpaceMemberBodyDto,
  ): Promise<ApiSuccessResponse<AddBandSpaceMemberResult>> {
    const createdMember = await this.bandSpacesService.addBandSpaceMember(bandspaceId, input);

    return createSuccessResponse('합주 공간 멤버 추가 성공', createdMember);
  }

  @Post('bands/:bandId/bandspaces')
  async createBandSpace(@Param('bandId') bandId: string, @Body() input: CreateBandSpaceBodyDto): Promise<ApiSuccessResponse<CreateBandSpaceResult>> {
    const createdSpace = await this.bandSpacesService.createBandSpace(bandId, input);

    return createSuccessResponse('합주 공간 생성 성공', createdSpace);
  }

  @Get('bands/:bandId/bandspaces')
  async getBandSpaces(@Param('bandId') bandId: string, @Query() query: GetBandSpacesQueryDto): Promise<ApiSuccessResponse<GetBandSpacesResult>> {
    const spaces = await this.bandSpacesService.getBandSpaces(bandId, query);

    return createSuccessResponse('합주 공간 목록 조회 성공', spaces);
  }

  @Get('bandspaces/:bandspaceId')
  async getBandSpaceDetail(@Param('bandspaceId') bandspaceId: string): Promise<ApiSuccessResponse<GetBandSpaceDetailResult>> {
    const spaceDetail = await this.bandSpacesService.getBandSpaceDetail(bandspaceId);

    return createSuccessResponse('합주 공간 상세 조회 성공', spaceDetail);
  }

  @Patch('bandspaces/:bandspaceId')
  async updateBandSpace(
    @Param('bandspaceId') bandspaceId: string,
    @Body() input: UpdateBandSpaceBodyDto,
  ): Promise<ApiSuccessResponse<UpdateBandSpaceResult>> {
    const updatedSpace = await this.bandSpacesService.updateBandSpace(bandspaceId, input);

    return createSuccessResponse('합주 공간 수정 성공', updatedSpace);
  }

  @Delete('bandspaces/:bandspaceId')
  async deleteBandSpace(@Param('bandspaceId') bandspaceId: string): Promise<ApiSuccessResponse<DeleteBandSpaceResult>> {
    const deletedSpace = await this.bandSpacesService.deleteBandSpace(bandspaceId);

    return createSuccessResponse('합주 공간 삭제 성공', deletedSpace);
  }

  @Patch('bandspaces/:bandspaceId/members/:memberId')
  async updateBandSpaceMemberRole(
    @Param('bandspaceId') bandspaceId: string,
    @Param('memberId') memberId: string,
    @Body() input: UpdateBandSpaceMemberRoleBodyDto,
  ): Promise<ApiSuccessResponse<UpdateBandSpaceMemberRoleResult>> {
    const updatedMember = await this.bandSpacesService.updateBandSpaceMemberRole(bandspaceId, memberId, input);

    return createSuccessResponse('합주 공간 멤버 역할 수정 성공', updatedMember);
  }

  @Delete('bandspaces/:bandspaceId/members/:memberId')
  async removeBandSpaceMember(
    @Param('bandspaceId') bandspaceId: string,
    @Param('memberId') memberId: string,
  ): Promise<ApiSuccessResponse<RemoveBandSpaceMemberResult>> {
    const removedMember = await this.bandSpacesService.removeBandSpaceMember(bandspaceId, memberId);

    return createSuccessResponse('합주 공간 멤버 제거 성공', removedMember);
  }
}

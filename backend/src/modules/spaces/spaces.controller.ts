import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { AddSpaceMemberBodyDto } from './dto/add-space-member.dto';
import { CreateBandSpaceBodyDto } from './dto/create-band-space.dto';
import { GetBandSpacesQueryDto } from './dto/get-band-spaces-query.dto';
import { UpdateBandSpaceBodyDto } from './dto/update-band-space.dto';
import { UpdateSpaceMemberRoleBodyDto } from './dto/update-space-member-role.dto';
import type { AddSpaceMemberResult } from './types/add-space-member-result.type';
import type { GetBandSpacesResult } from './types/band-space-list-item.type';
import type { CreateBandSpaceResult } from './types/create-band-space-result.type';
import type { DeleteBandSpaceResult } from './types/delete-band-space-result.type';
import type { GetSpaceDetailResult } from './types/space-detail.type';
import type { UpdateBandSpaceResult } from './types/update-band-space-result.type';
import type { UpdateSpaceMemberRoleResult } from './types/update-space-member-role-result.type';
import { SpacesService } from './spaces.service';

@Controller()
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post('bandspaces/:bandspaceId/members')
  async addSpaceMember(
    @Param('bandspaceId') bandspaceId: string,
    @Body() input: AddSpaceMemberBodyDto,
  ): Promise<ApiSuccessResponse<AddSpaceMemberResult>> {
    const createdMember = await this.spacesService.addSpaceMember(bandspaceId, input);

    return createSuccessResponse('합주 공간 멤버 추가 성공', createdMember);
  }

  @Post('bands/:bandId/bandspaces')
  async createBandSpace(@Param('bandId') bandId: string, @Body() input: CreateBandSpaceBodyDto): Promise<ApiSuccessResponse<CreateBandSpaceResult>> {
    const createdSpace = await this.spacesService.createBandSpace(bandId, input);

    return createSuccessResponse('합주 공간 생성 성공', createdSpace);
  }

  @Get('bands/:bandId/bandspaces')
  async getBandSpaces(@Param('bandId') bandId: string, @Query() query: GetBandSpacesQueryDto): Promise<ApiSuccessResponse<GetBandSpacesResult>> {
    const spaces = await this.spacesService.getBandSpaces(bandId, query);

    return createSuccessResponse('합주 공간 목록 조회 성공', spaces);
  }

  @Get('bandspaces/:bandspaceId')
  async getSpaceDetail(@Param('bandspaceId') bandspaceId: string): Promise<ApiSuccessResponse<GetSpaceDetailResult>> {
    const spaceDetail = await this.spacesService.getSpaceDetail(bandspaceId);

    return createSuccessResponse('합주 공간 상세 조회 성공', spaceDetail);
  }

  @Patch('bandspaces/:bandspaceId')
  async updateBandSpace(
    @Param('bandspaceId') bandspaceId: string,
    @Body() input: UpdateBandSpaceBodyDto,
  ): Promise<ApiSuccessResponse<UpdateBandSpaceResult>> {
    const updatedSpace = await this.spacesService.updateBandSpace(bandspaceId, input);

    return createSuccessResponse('합주 공간 수정 성공', updatedSpace);
  }

  @Delete('bandspaces/:bandspaceId')
  async deleteBandSpace(@Param('bandspaceId') bandspaceId: string): Promise<ApiSuccessResponse<DeleteBandSpaceResult>> {
    const deletedSpace = await this.spacesService.deleteBandSpace(bandspaceId);

    return createSuccessResponse('합주 공간 삭제 성공', deletedSpace);
  }

  @Patch('bandspaces/:bandspaceId/members/:memberId')
  async updateSpaceMemberRole(
    @Param('bandspaceId') bandspaceId: string,
    @Param('memberId') memberId: string,
    @Body() input: UpdateSpaceMemberRoleBodyDto,
  ): Promise<ApiSuccessResponse<UpdateSpaceMemberRoleResult>> {
    const updatedMember = await this.spacesService.updateSpaceMemberRole(bandspaceId, memberId, input);

    return createSuccessResponse('합주 공간 멤버 역할 수정 성공', updatedMember);
  }
}

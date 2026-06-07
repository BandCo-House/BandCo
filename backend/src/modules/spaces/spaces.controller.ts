import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { AddSpaceMemberBodyDto } from './dto/add-space-member.dto';
import { CreateBandSpaceBodyDto } from './dto/create-band-space.dto';
import { GetBandSpacesQueryDto } from './dto/get-band-spaces-query.dto';
import type { AddSpaceMemberResult } from './types/add-space-member-result.type';
import type { GetBandSpacesResult } from './types/band-space-list-item.type';
import type { CreateBandSpaceResult } from './types/create-band-space-result.type';
import type { GetSpaceDetailResult } from './types/space-detail.type';
import { SpacesService } from './spaces.service';

@ApiTags('합주 공간')
@Controller()
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post('spaces/:spaceId/members')
  @ApiOperation({ summary: '합주 공간 멤버 추가' })
  @ApiParam({ name: 'spaceId', description: '합주 공간 ID (UUID)', type: String })
  @ApiResponse({ status: 201, description: '합주 공간 멤버 추가 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 404, description: '합주 공간을 찾을 수 없음' })
  async addSpaceMember(@Param('spaceId') spaceId: string, @Body() input: AddSpaceMemberBodyDto): Promise<ApiSuccessResponse<AddSpaceMemberResult>> {
    const createdMember = await this.spacesService.addSpaceMember(spaceId, input);

    return createSuccessResponse('합주 공간 멤버 추가 성공', createdMember);
  }

  @Post('bands/:bandId/spaces')
  @ApiOperation({ summary: '합주 공간 생성' })
  @ApiParam({ name: 'bandId', description: '밴드 ID (UUID)', type: String })
  @ApiResponse({ status: 201, description: '합주 공간 생성 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 404, description: '밴드를 찾을 수 없음' })
  async createBandSpace(@Param('bandId') bandId: string, @Body() input: CreateBandSpaceBodyDto): Promise<ApiSuccessResponse<CreateBandSpaceResult>> {
    const createdSpace = await this.spacesService.createBandSpace(bandId, input);

    return createSuccessResponse('합주 공간 생성 성공', createdSpace);
  }

  @Get('bands/:bandId/spaces')
  @ApiOperation({ summary: '합주 공간 목록 조회' })
  @ApiParam({ name: 'bandId', description: '밴드 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '합주 공간 목록 조회 성공' })
  @ApiResponse({ status: 404, description: '밴드를 찾을 수 없음' })
  async getBandSpaces(@Param('bandId') bandId: string, @Query() query: GetBandSpacesQueryDto): Promise<ApiSuccessResponse<GetBandSpacesResult>> {
    const spaces = await this.spacesService.getBandSpaces(bandId, query);

    return createSuccessResponse('합주 공간 목록 조회 성공', spaces);
  }

  @Get('spaces/:spaceId')
  @ApiOperation({ summary: '합주 공간 상세 조회' })
  @ApiParam({ name: 'spaceId', description: '합주 공간 ID (UUID)', type: String })
  @ApiResponse({ status: 200, description: '합주 공간 상세 조회 성공' })
  @ApiResponse({ status: 404, description: '합주 공간을 찾을 수 없음' })
  async getSpaceDetail(@Param('spaceId') spaceId: string): Promise<ApiSuccessResponse<GetSpaceDetailResult>> {
    const spaceDetail = await this.spacesService.getSpaceDetail(spaceId);

    return createSuccessResponse('합주 공간 상세 조회 성공', spaceDetail);
  }
}

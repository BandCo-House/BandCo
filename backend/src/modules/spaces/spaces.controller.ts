import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { type AddSpaceMemberRequestBody, parseAddSpaceMemberBody } from './dto/add-space-member.dto';
import { type CreateBandSpaceRequestBody, parseCreateBandSpaceBody } from './dto/create-band-space.dto';
import { type GetBandSpacesQueryParams, parseGetBandSpacesQuery } from './dto/get-band-spaces-query.dto';
import type { AddSpaceMemberResult } from './types/add-space-member-result.type';
import type { GetBandSpacesResult } from './types/band-space-list-item.type';
import type { CreateBandSpaceResult } from './types/create-band-space-result.type';
import type { GetSpaceDetailResult } from './types/space-detail.type';
import { SpacesService } from './spaces.service';

@Controller()
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Post('spaces/:spaceId/members')
  async addSpaceMember(
    @Param('spaceId') spaceId: string,
    @Body() rawBody: AddSpaceMemberRequestBody,
  ): Promise<ApiSuccessResponse<AddSpaceMemberResult>> {
    const input = parseAddSpaceMemberBody(rawBody);
    const createdMember = await this.spacesService.addSpaceMember(spaceId, input);

    return createSuccessResponse('합주 공간 멤버 추가 성공', createdMember);
  }

  @Post('bands/:bandId/spaces')
  async createBandSpace(
    @Param('bandId') bandId: string,
    @Body() rawBody: CreateBandSpaceRequestBody,
  ): Promise<ApiSuccessResponse<CreateBandSpaceResult>> {
    const input = parseCreateBandSpaceBody(rawBody);
    const createdSpace = await this.spacesService.createBandSpace(bandId, input);

    return createSuccessResponse('합주 공간 생성 성공', createdSpace);
  }

  @Get('bands/:bandId/spaces')
  async getBandSpaces(
    @Param('bandId') bandId: string,
    @Query() rawQuery: GetBandSpacesQueryParams,
  ): Promise<ApiSuccessResponse<GetBandSpacesResult>> {
    const query = parseGetBandSpacesQuery(rawQuery);
    const spaces = await this.spacesService.getBandSpaces(bandId, query);

    return createSuccessResponse('합주 공간 목록 조회 성공', spaces);
  }

  @Get('spaces/:spaceId')
  async getSpaceDetail(@Param('spaceId') spaceId: string): Promise<ApiSuccessResponse<GetSpaceDetailResult>> {
    const spaceDetail = await this.spacesService.getSpaceDetail(spaceId);

    return createSuccessResponse('합주 공간 상세 조회 성공', spaceDetail);
  }
}

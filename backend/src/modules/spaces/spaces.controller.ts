import { Controller, Get, Param, Query } from '@nestjs/common';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { type GetBandSpacesQueryParams, parseGetBandSpacesQuery } from './dto/get-band-spaces-query.dto';
import type { GetBandSpacesResult } from './types/band-space-list-item.type';
import type { GetSpaceDetailResult } from './types/space-detail.type';
import { SpacesService } from './spaces.service';

@Controller()
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

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

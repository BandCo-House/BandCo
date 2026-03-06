import { Controller, Get, Param, Query } from '@nestjs/common';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { type GetBandSpacesQueryParams, parseGetBandSpacesQuery } from './dto/get-band-spaces-query.dto';
import type { GetBandSpacesResult } from './types/band-space-list-item.type';
import { SpacesService } from './spaces.service';

@Controller('bands/:bandId/spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Get()
  getBandSpaces(@Param('bandId') bandId: string, @Query() rawQuery: GetBandSpacesQueryParams): ApiSuccessResponse<GetBandSpacesResult> {
    const query = parseGetBandSpacesQuery(rawQuery);
    const spaces = this.spacesService.getBandSpaces(bandId, query);

    return createSuccessResponse('합주 공간 목록 조회 성공', spaces);
  }
}

import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { User } from '../../generated/prisma';

import { CreatePlaceBodyDto } from './dto/create-place.dto';
import { GetBandPlacesQueryDto } from './dto/get-band-places-query.dto';
import type { CreatePlaceResult } from './types/create-place-result.type';
import type { GetBandPlacesResult } from './types/place-list.type';
import { PlacesService } from './places.service';

interface AuthenticatedRequest {
  user: User;
}

@Controller()
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Post('bands/:bandId/places')
  @UseGuards(AccessTokenGuard)
  async createPlace(
    @Req() request: AuthenticatedRequest,
    @Param('bandId') bandId: string,
    @Body() input: CreatePlaceBodyDto,
  ): Promise<ApiSuccessResponse<CreatePlaceResult>> {
    const result = await this.placesService.createPlace(request.user.id, bandId, input);

    return createSuccessResponse('장소 생성 성공', result);
  }

  @Get('bands/:bandId/places')
  @UseGuards(AccessTokenGuard)
  async getBandPlaces(
    @Req() request: AuthenticatedRequest,
    @Param('bandId') bandId: string,
    @Query() query: GetBandPlacesQueryDto,
  ): Promise<ApiSuccessResponse<GetBandPlacesResult>> {
    const result = await this.placesService.getBandPlaces(request.user.id, bandId, query);

    return createSuccessResponse('장소 목록 조회 성공', result);
  }
}

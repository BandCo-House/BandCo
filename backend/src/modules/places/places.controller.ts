import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { User } from '../../generated/prisma';

import { CreatePlaceBodyDto } from './dto/create-place.dto';
import { GetBandPlacesQueryDto } from './dto/get-band-places-query.dto';
import { GetPlaceDetailQueryDto } from './dto/get-place-detail-query.dto';
import { UpdatePlaceBodyDto } from './dto/update-place.dto';
import type { CreatePlaceResult } from './types/create-place-result.type';
import type { PlaceDetail } from './types/place-detail.type';
import type { GetBandPlacesResult } from './types/place-list.type';
import type { DeletePlaceResult } from './types/delete-place-result.type';
import type { UpdatePlaceResult } from './types/update-place-result.type';
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

  @Get('places/:placeId')
  @UseGuards(AccessTokenGuard)
  async getPlace(
    @Req() request: AuthenticatedRequest,
    @Param('placeId') placeId: string,
    @Query() query: GetPlaceDetailQueryDto,
  ): Promise<ApiSuccessResponse<PlaceDetail>> {
    const result = await this.placesService.getPlace(request.user.id, placeId, query.where__is_active);

    return createSuccessResponse('장소 상세 조회 성공', result);
  }

  @Patch('places/:placeId')
  @UseGuards(AccessTokenGuard)
  async updatePlace(
    @Req() request: AuthenticatedRequest,
    @Param('placeId') placeId: string,
    @Body() input: UpdatePlaceBodyDto,
  ): Promise<ApiSuccessResponse<UpdatePlaceResult>> {
    const result = await this.placesService.updatePlace(request.user.id, placeId, input);

    return createSuccessResponse('장소 수정 성공', result);
  }

  @Delete('places/:placeId')
  @UseGuards(AccessTokenGuard)
  async deletePlace(@Req() request: AuthenticatedRequest, @Param('placeId') placeId: string): Promise<ApiSuccessResponse<DeletePlaceResult>> {
    const result = await this.placesService.deletePlace(request.user.id, placeId);

    return createSuccessResponse('장소 삭제 성공', result);
  }
}

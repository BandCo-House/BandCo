import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { User } from '../../generated/prisma';

import { CreatePlaceBodyDto } from './dto/create-place.dto';
import { GetBandPlacesQueryDto } from './dto/get-band-places-query.dto';
import { GetPlaceDetailQueryDto } from './dto/get-place-detail-query.dto';
import { UpdatePlaceBodyDto } from './dto/update-place.dto';
import type { CreatePlaceResult } from './types/create-place-result.type';
import type { DeletePlaceResult } from './types/delete-place-result.type';
import type { PlaceDetail } from './types/place-detail.type';
import type { GetBandPlacesResult } from './types/place-list.type';
import type { UpdatePlaceResult } from './types/update-place-result.type';
import { PlacesService } from './places.service';

interface AuthenticatedRequest {
  user: User;
}

@Controller()
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  /**
   * 밴드에 새 장소를 등록한다.
   *
   * @param {AuthenticatedRequest} request - 인증된 요청 객체 (request.user.id 사용)
   * @param {string} bandId - 장소를 등록할 밴드 ID
   * @param {CreatePlaceBodyDto} input - 장소 생성에 필요한 본문 데이터
   * @returns {Promise<ApiSuccessResponse<CreatePlaceResult>>} 생성된 장소 정보
   * @throws {ForbiddenException} 요청 사용자가 해당 밴드 멤버가 아닌 경우
   * @throws {BadRequestException} 입력 데이터 유효성 검사 실패
   */
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

  /**
   * 밴드에 등록된 장소 목록을 페이지네이션으로 조회한다.
   *
   * @param {AuthenticatedRequest} request - 인증된 요청 객체 (request.user.id 사용)
   * @param {string} bandId - 장소 목록을 조회할 밴드 ID
   * @param {GetBandPlacesQueryDto} query - 페이지네이션 및 필터 조건
   * @returns {Promise<ApiSuccessResponse<GetBandPlacesResult>>} 장소 목록과 페이지네이션 메타
   * @throws {ForbiddenException} 요청 사용자가 해당 밴드 멤버가 아닌 경우
   * @throws {NotFoundException} 밴드가 존재하지 않는 경우
   */
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

  /**
   * 특정 장소의 상세 정보를 조회한다.
   *
   * @param {AuthenticatedRequest} request - 인증된 요청 객체 (request.user.id 사용)
   * @param {string} placeId - 조회할 장소 ID
   * @param {GetPlaceDetailQueryDto} query - 활성 여부 필터 (where__is_active)
   * @returns {Promise<ApiSuccessResponse<PlaceDetail>>} 장소 상세 정보
   * @throws {ForbiddenException} 요청 사용자가 해당 장소의 밴드 멤버가 아닌 경우
   * @throws {NotFoundException} 장소가 존재하지 않거나 비활성 상태인 경우
   */
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

  /**
   * 특정 장소의 정보를 수정한다.
   *
   * @param {AuthenticatedRequest} request - 인증된 요청 객체 (request.user.id 사용)
   * @param {string} placeId - 수정할 장소 ID
   * @param {UpdatePlaceBodyDto} input - 장소 수정에 필요한 본문 데이터
   * @returns {Promise<ApiSuccessResponse<UpdatePlaceResult>>} 수정된 장소 정보
   * @throws {ForbiddenException} 요청 사용자가 해당 장소의 밴드 멤버가 아닌 경우
   * @throws {NotFoundException} 장소가 존재하지 않는 경우
   * @throws {BadRequestException} 입력 데이터 유효성 검사 실패
   */
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

  /**
   * 특정 장소를 삭제(소프트 삭제)한다.
   *
   * @param {AuthenticatedRequest} request - 인증된 요청 객체 (request.user.id 사용)
   * @param {string} placeId - 삭제할 장소 ID
   * @returns {Promise<ApiSuccessResponse<DeletePlaceResult>>} 삭제된 장소 정보
   * @throws {ForbiddenException} 요청 사용자가 해당 장소의 밴드 멤버가 아닌 경우
   * @throws {NotFoundException} 장소가 존재하지 않는 경우
   */
  @Delete('places/:placeId')
  @UseGuards(AccessTokenGuard)
  async deletePlace(@Req() request: AuthenticatedRequest, @Param('placeId') placeId: string): Promise<ApiSuccessResponse<DeletePlaceResult>> {
    const result = await this.placesService.deletePlace(request.user.id, placeId);

    return createSuccessResponse('장소 삭제 성공', result);
  }
}

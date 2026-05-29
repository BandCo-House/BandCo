import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { User } from '../../generated/prisma';

import { CreatePlaceBodyDto } from './dto/create-place.dto';
import type { CreatePlaceResult } from './types/create-place-result.type';
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
}

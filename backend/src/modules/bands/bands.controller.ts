import { Body, Controller, Post } from '@nestjs/common';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { type CreateBandRequestBody, parseCreateBandBody } from './dto/create-band.dto';
import type { CreateBandResult } from './types/create-band-result.type';
import { BandsService } from './bands.service';

@Controller()
export class BandsController {
  constructor(private readonly bandsService: BandsService) {}

  @Post('bands')
  async createBand(@Body() rawBody: CreateBandRequestBody): Promise<ApiSuccessResponse<CreateBandResult>> {
    const input = parseCreateBandBody(rawBody);
    const createdBand = await this.bandsService.createBand(input);

    return createSuccessResponse('밴드 생성 성공', createdBand);
  }
}

import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { type CreateBandRequestBody, parseCreateBandBody } from './dto/create-band.dto';
import { type CreateBandResult, CreateBandSuccessResponseDto } from './types/create-band-result.type';
import { BandsService } from './bands.service';

@ApiTags('bands')
@Controller()
export class BandsController {
  constructor(private readonly bandsService: BandsService) {}

  @ApiOperation({
    summary: '밴드 생성',
    description: '이름, 설명, 공개 여부를 받아 새 밴드를 만든다.',
  })
  @ApiCreatedResponse({
    description: '밴드 생성 성공',
    type: CreateBandSuccessResponseDto,
  })
  @Post('bands')
  async createBand(@Body() rawBody: CreateBandRequestBody): Promise<ApiSuccessResponse<CreateBandResult>> {
    const input = parseCreateBandBody(rawBody);
    const createdBand = await this.bandsService.createBand(input);

    return createSuccessResponse('밴드 생성 성공', createdBand);
  }
}

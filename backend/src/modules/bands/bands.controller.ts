import { Body, Controller, Delete, Param, Post, Req, UseGuards } from '@nestjs/common';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { User } from '../../generated/prisma';

import { CreateBandBodyDto } from './dto/create-band.dto';
import type { CreateBandResult } from './types/create-band-result.type';
import type { DeleteBandResult } from './types/delete-band-result.type';
import { BandsService } from './bands.service';

interface AuthenticatedRequest {
  user: User;
}

@Controller('bands')
export class BandsController {
  constructor(private readonly bandsService: BandsService) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  async createBand(@Req() request: AuthenticatedRequest, @Body() input: CreateBandBodyDto): Promise<ApiSuccessResponse<CreateBandResult>> {
    const createdBand = await this.bandsService.createBand(request.user.id, input);

    return createSuccessResponse('밴드 생성 성공', createdBand);
  }

  @Delete(':bandId')
  @UseGuards(AccessTokenGuard)
  async deleteBand(@Req() request: AuthenticatedRequest, @Param('bandId') bandId: string): Promise<ApiSuccessResponse<DeleteBandResult>> {
    const deletedBand = await this.bandsService.deleteBand(request.user.id, bandId);

    return createSuccessResponse('밴드가 삭제되었습니다.', deletedBand);
  }
}

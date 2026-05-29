import { Controller, Get } from '@nestjs/common';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response/api-response';

import type { GenreListResult } from './types/genre-list.type';
import type { SkillTypeListResult } from './types/skill-type-list.type';
import { CommonService } from './common.service';

@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Get('genres')
  async getGenres(): Promise<ApiSuccessResponse<GenreListResult>> {
    const result = await this.commonService.getGenres();
    return createSuccessResponse('장르 목록 조회 완료', result);
  }

  @Get('skills')
  async getSkillTypes(): Promise<ApiSuccessResponse<SkillTypeListResult>> {
    const result = await this.commonService.getSkillTypes();
    return createSuccessResponse('스킬 목록 조회 완료', result);
  }
}

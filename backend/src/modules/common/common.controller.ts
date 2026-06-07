import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response/api-response';

import type { GenreListResult } from './types/genre-list.type';
import type { SkillTypeListResult } from './types/skill-type-list.type';
import { CommonService } from './common.service';

@ApiTags('공통')
@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Get('genres')
  @ApiOperation({ summary: '장르 목록 조회' })
  @ApiResponse({ status: 200, description: '장르 목록 조회 성공' })
  async getGenres(): Promise<ApiSuccessResponse<GenreListResult>> {
    const result = await this.commonService.getGenres();
    return createSuccessResponse('장르 목록 조회 완료', result);
  }

  @Get('skills')
  @ApiOperation({ summary: '스킬 타입 목록 조회' })
  @ApiResponse({ status: 200, description: '스킬 타입 목록 조회 성공' })
  async getSkillTypes(): Promise<ApiSuccessResponse<SkillTypeListResult>> {
    const result = await this.commonService.getSkillTypes();
    return createSuccessResponse('스킬 목록 조회 완료', result);
  }
}

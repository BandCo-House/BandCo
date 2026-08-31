import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '../../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';
import type { AuthUser } from '../users/repositoreis/user.repository';

import { AskAssistantBodyDto } from './dto/ask-assistant.dto';
import { AssistantRateLimitGuard } from './rate-limit/assistant-rate-limit.guard';
import type { AssistantAnswer } from './types/assistant-answer.type';
import { AssistantService } from './assistant.service';

interface AuthenticatedRequest {
  user: AuthUser;
}

interface GetAssistantPresetsResult {
  presets: { id: string; question: string }[];
}

@ApiTags('어시스턴트')
@Controller()
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Get('assistant/presets')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '추천 질문 목록 조회' })
  @ApiResponse({ status: 200, description: '추천 질문 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  getAssistantPresets(): ApiSuccessResponse<GetAssistantPresetsResult> {
    return createSuccessResponse('추천 질문 목록 조회 성공', { presets: this.assistantService.getPresets() });
  }

  @Post('bands/:bandId/assistant/query')
  @UseGuards(AccessTokenGuard, AssistantRateLimitGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '자연어로 밴드 데이터 조회' })
  @ApiParam({ name: 'bandId', description: '밴드 ID (UUID)', type: String })
  @ApiResponse({ status: 201, description: '조회 성공' })
  @ApiResponse({ status: 400, description: '잘못된 요청' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '추천 질문을 찾을 수 없음' })
  @ApiResponse({ status: 429, description: '질문 요청 횟수 초과' })
  @ApiResponse({ status: 503, description: 'AI 응답 생성 실패' })
  async askAssistant(
    @Req() req: AuthenticatedRequest,
    @Param('bandId') bandId: string,
    @Body() body: AskAssistantBodyDto,
  ): Promise<ApiSuccessResponse<AssistantAnswer>> {
    const result = await this.assistantService.askAssistant(req.user.id, bandId, body);

    return createSuccessResponse('조회 성공', result);
  }
}

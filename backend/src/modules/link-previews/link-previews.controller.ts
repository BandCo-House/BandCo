import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { type ApiSuccessResponse, createSuccessResponse } from '../../common/api-response';

import { GetLinkPreviewQueryDto } from './dto/get-link-preview-query.dto';
import type { LinkPreview } from './types/link-preview.type';
import { LinkPreviewsService } from './link-previews.service';

@ApiTags('링크 미리보기')
@Controller('link-previews')
export class LinkPreviewsController {
  constructor(private readonly linkPreviewsService: LinkPreviewsService) {}

  @Get()
  @ApiOperation({ summary: '외부 링크 미리보기 조회' })
  @ApiResponse({ status: 200, description: '링크 미리보기 조회 성공' })
  @ApiResponse({ status: 400, description: '잘못된 URL 형식' })
  async getLinkPreview(@Query() query: GetLinkPreviewQueryDto): Promise<ApiSuccessResponse<LinkPreview>> {
    const result = await this.linkPreviewsService.getLinkPreview(query.url);
    return createSuccessResponse('링크 미리보기 조회 성공', result);
  }
}

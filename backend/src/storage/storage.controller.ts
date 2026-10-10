import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/guard/bearer-token.guard';
import { type ApiSuccessResponse, createSuccessResponse } from '../common/api-response';

import { GetPresignedUrlDto } from './dto/get-presigned-url.dto';
import { StorageService } from './storage.service';

interface AuthenticatedRequest {
  user: { id: string };
}

@ApiTags('스토리지')
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  /**
   * 인증된 유저의 폴더에 파일을 업로드할 Presigned URL을 발급한다.
   *
   * @param request - 인증된 요청 객체 (request.user.id 사용)
   * @param dto - 업로드 폴더 경로와 MIME 타입
   * @returns Presigned URL과 업로드 후 접근 가능한 오브젝트 URL
   */
  @Post('presigned-url')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Presigned URL 발급' })
  @ApiResponse({ status: 201, description: 'Presigned URL 발급 성공' })
  @ApiResponse({ status: 400, description: '잘못된 입력' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 503, description: '스토리지 환경변수 미설정' })
  async getPresignedUrl(
    @Req() request: AuthenticatedRequest,
    @Body() dto: GetPresignedUrlDto,
  ): Promise<ApiSuccessResponse<{ presignedUrl: string; objectUrl: string }>> {
    const result = await this.storageService.generateUploadUrl(request.user.id, dto.folder, dto.contentType);
    return createSuccessResponse('Presigned URL 발급 성공', result);
  }

  /**
   * 오브젝트 key로 다운로드용 Presigned URL을 발급한다.
   *
   * @param key 오브젝트 키 (예: users/{userId}/profiles/{uuid}.jpeg)
   * @returns 다운로드용 Presigned URL
   */
  @Get('download-url')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: '다운로드 Presigned URL 발급' })
  @ApiResponse({ status: 200, description: '다운로드 Presigned URL 발급 성공' })
  @ApiResponse({ status: 401, description: '인증 실패' })
  @ApiResponse({ status: 503, description: '스토리지 환경변수 미설정' })
  async getDownloadUrl(@Query('key') key: string): Promise<ApiSuccessResponse<{ presignedUrl: string }>> {
    const result = await this.storageService.generateDownloadUrl(key);
    return createSuccessResponse('다운로드 Presigned URL 발급 성공', result);
  }
}

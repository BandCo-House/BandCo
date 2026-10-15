import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsISO8601, IsOptional, Matches } from 'class-validator';
import { normalizeOptionalStringValue } from 'src/common/validation/transform.util';
import { iso8601ValidationMessage } from 'src/common/validation-message/iso8601-validation.message';
import { matchValidationMessage } from 'src/common/validation-message/match-validation.message';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class GetAdminDashboardFunnelQueryDto {
  @ApiPropertyOptional({ description: '코호트 가입 시작일(KST, YYYY-MM-DD). 없으면 종료일 포함 최근 30일의 첫날', example: '2026-09-06' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: matchValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  from?: string;

  @ApiPropertyOptional({ description: '코호트 가입 종료일(KST, YYYY-MM-DD, 포함). 없으면 오늘', example: '2026-10-05' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @Matches(DATE_ONLY_PATTERN, { message: matchValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  to?: string;
}

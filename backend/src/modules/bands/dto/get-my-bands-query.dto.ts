import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { intValidationMessage } from 'src/common/validation-message/int-validation.message';
import { minValidationMessage } from 'src/common/validation-message/min-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';

import { normalizeOptionalStringValue, parseOptionalPositiveIntegerValue } from '../../../common/validation/transform.util';

export class GetMyBandsQueryDto {
  @ApiPropertyOptional({ description: '한 번에 가져올 항목 수', default: 20, minimum: 1 })
  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  take: number = 20;

  @ApiPropertyOptional({ description: '커서 생성일 (ISO 8601)', example: '2024-01-01T00:00:00.000Z' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  cursor__created_at?: string;

  @ApiPropertyOptional({ description: '커서 ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsUUID(undefined, { message: uuidValidationMessage })
  cursor__id?: string;
}

export type GetMyBandsQuery = GetMyBandsQueryDto;

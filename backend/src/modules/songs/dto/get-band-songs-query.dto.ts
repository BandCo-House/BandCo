import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

import { normalizeOptionalStringValue, parseOptionalPositiveIntegerValue } from '../../../common/validation/transform.util';
import { enumValidationMessage } from '../../../common/validation-message/enum-validation.message';
import { intValidationMessage } from '../../../common/validation-message/int-validation.message';
import { minValidationMessage } from '../../../common/validation-message/min-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';
import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';

const ORDER_DIRECTIONS = ['asc', 'desc'] as const;
export type SongListOrderDirection = (typeof ORDER_DIRECTIONS)[number];

/**
 * 곡 목록 조회 조건을 기존 커서 기반 목록 API 규칙에 맞춰 검증한다.
 */
export class GetBandSongsQueryDto {
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  where__title__contain?: string;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  where__artist_name__contain?: string;

  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__created_at: SongListOrderDirection = 'desc';

  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__id: SongListOrderDirection = 'desc';

  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  take: number = 20;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  cursor__created_at?: string;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsUUID(undefined, { message: uuidValidationMessage })
  cursor__id?: string;
}

export type GetBandSongsQuery = GetBandSongsQueryDto;

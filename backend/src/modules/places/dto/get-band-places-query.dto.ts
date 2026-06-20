import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsISO8601, IsOptional, IsString, IsUUID, Min } from 'class-validator';

import {
  normalizeOptionalStringValue,
  parseOptionalBooleanValue,
  parseOptionalPositiveIntegerValue,
} from '../../../common/validation/transform.util';
import { booleanValidationMessage } from '../../../common/validation-message/boolean-validation.message';
import { enumValidationMessage } from '../../../common/validation-message/enum-validation.message';
import { intValidationMessage } from '../../../common/validation-message/int-validation.message';
import { iso8601ValidationMessage } from '../../../common/validation-message/iso8601-validation.message';
import { minValidationMessage } from '../../../common/validation-message/min-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';
import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';

const ORDER_DIRECTIONS = ['ASC', 'DESC'] as const;
export type PlaceListOrderDirection = (typeof ORDER_DIRECTIONS)[number];

/**
 * 장소 목록 조회 조건을 커서 기반 목록 API 규칙에 맞춰 검증한다.
 */
export class GetBandPlacesQueryDto {
  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__created_at: PlaceListOrderDirection = 'DESC';

  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__id: PlaceListOrderDirection = 'DESC';

  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  take: number = 20;

  @Transform(parseOptionalBooleanValue)
  @IsOptional()
  @IsBoolean({ message: booleanValidationMessage })
  where__is_active?: boolean;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  cursor__created_at?: string;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsUUID(undefined, { message: uuidValidationMessage })
  cursor__id?: string;
}

export type GetBandPlacesQuery = GetBandPlacesQueryDto;

import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

import { parseOptionalBooleanValue } from '../../../common/validation/transform.util';
import { booleanValidationMessage } from '../../../common/validation-message/boolean-validation.message';

/**
 * 장소 상세 조회 쿼리를 검증한다.
 */
export class GetPlaceDetailQueryDto {
  @Transform(parseOptionalBooleanValue)
  @IsOptional()
  @IsBoolean({ message: booleanValidationMessage })
  where__is_active?: boolean;
}

export type GetPlaceDetailQuery = GetPlaceDetailQueryDto;

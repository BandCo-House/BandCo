import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

import {
  normalizeOptionalStringValue,
  parseOptionalBooleanValue,
  parseOptionalPositiveIntegerValue,
} from '../../../common/validation/transform.util';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { booleanValidationMessage } from 'src/common/validation-message/boolean-validation.message';
import { intValidationMessage } from 'src/common/validation-message/int-validation.message';
import { minValidationMessage } from 'src/common/validation-message/min-validation.message';

/**
 * 합주 공간 목록 조회 쿼리를 검증하고 서비스에서 바로 쓸 수 있는 형태로 만든다.
 */
export class GetBandSpacesQueryDto {
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: stringValidationMessage,
  })
  query?: string;

  @Transform(parseOptionalBooleanValue)
  @IsOptional()
  @IsBoolean({
    message: booleanValidationMessage,
  })
  onlyMine?: boolean;

  @Transform(parseOptionalBooleanValue)
  @IsOptional()
  @IsBoolean({
    message: booleanValidationMessage,
  })
  inProgressOnly?: boolean;

  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({
    message: intValidationMessage,
  })
  @Min(1, {
    message: minValidationMessage,
  })
  page: number = 1;

  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({
    message: intValidationMessage,
  })
  @Min(1, {
    message: minValidationMessage,
  })
  size: number = 20;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: stringValidationMessage,
  })
  sort?: string;
}

export type GetBandSpacesQuery = GetBandSpacesQueryDto;

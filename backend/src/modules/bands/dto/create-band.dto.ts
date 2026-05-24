import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { normalizeOptionalStringValue, trimStringValue } from '../../../common/validation/transform.util';
import { booleanValidationMessage } from '../../../common/validation-message/boolean-validation.message';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { notemptyValidationMessage } from '../../../common/validation-message/notempty-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';
import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';

/**
 * 밴드 생성 요청 본문을 검증한다.
 */
export class CreateBandBodyDto {
  @Transform(trimStringValue)
  @IsString({
    message: stringValidationMessage,
  })
  @IsNotEmpty({
    message: notemptyValidationMessage,
  })
  @MaxLength(40, {
    message: lengthValidationMessage,
  })
  name!: string;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: stringValidationMessage,
  })
  description?: string;

  @IsBoolean({
    message: booleanValidationMessage,
  })
  visibility!: boolean;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: stringValidationMessage,
  })
  coverImgUrl?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', {
    each: true,
    message: uuidValidationMessage,
  })
  genreIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', {
    each: true,
    message: uuidValidationMessage,
  })
  inviteeUserIds?: string[];
}

export type CreateBandInput = CreateBandBodyDto;

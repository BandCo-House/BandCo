import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { normalizeOptionalStringValue, trimStringValue } from '../../../common/validation/transform.util';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { notemptyValidationMessage } from '../../../common/validation-message/notempty-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';

/**
 * 장소 생성 요청 본문을 검증한다.
 */
export class CreatePlaceBodyDto {
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  @MaxLength(120, { message: lengthValidationMessage })
  name!: string;

  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  @MaxLength(255, { message: lengthValidationMessage })
  address!: string;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(255, { message: lengthValidationMessage })
  detailAddress?: string;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(255, { message: lengthValidationMessage })
  imageUrl?: string;
}

export type CreatePlaceInput = CreatePlaceBodyDto;

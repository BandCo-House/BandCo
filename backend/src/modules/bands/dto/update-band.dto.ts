import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { booleanValidationMessage } from 'src/common/validation-message/boolean-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

import { normalizeOptionalStringValue, trimStringValue } from '../../../common/validation/transform.util';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';

export class UpdateBandBodyDto {
  @Transform(trimStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(40, { message: lengthValidationMessage })
  name?: string;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  description?: string | null;

  @IsOptional()
  @IsBoolean({ message: booleanValidationMessage })
  visibility?: boolean;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  coverImgUrl?: string | null;
}

export type UpdateBandInput = UpdateBandBodyDto;

import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

import { normalizeOptionalStringValue } from '../../../common/validation/transform.util';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';

export class CreateBandJoinRequestBodyDto {
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: stringValidationMessage,
  })
  @MaxLength(500, {
    message: lengthValidationMessage,
  })
  message?: string;
}

export type CreateBandJoinRequestInput = CreateBandJoinRequestBodyDto;

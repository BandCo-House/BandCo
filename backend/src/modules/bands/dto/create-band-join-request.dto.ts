import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

import { normalizeOptionalStringValue } from '../../../common/validation/transform.util';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';

export class CreateBandJoinRequestBodyDto {
  @ApiPropertyOptional({ description: '가입 요청 메시지 (최대 500자)', example: '밴드에 합류하고 싶습니다!' })
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

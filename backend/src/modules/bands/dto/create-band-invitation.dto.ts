import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { normalizeOptionalStringValue } from '../../../common/validation/transform.util';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';
import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';

export class CreateBandInvitationBodyDto {
  @IsUUID('4', {
    message: uuidValidationMessage,
  })
  inviteeUserId!: string;

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

export type CreateBandInvitationInput = CreateBandInvitationBodyDto;

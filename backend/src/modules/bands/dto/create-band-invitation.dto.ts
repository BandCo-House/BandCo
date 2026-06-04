import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { normalizeOptionalStringValue } from '../../../common/validation/transform.util';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';
import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';

export class CreateBandInvitationBodyDto {
  @ApiProperty({ description: '초대받을 유저 ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('4', {
    message: uuidValidationMessage,
  })
  inviteeUserId!: string;

  @ApiPropertyOptional({ description: '초대 메시지 (최대 500자)', example: '우리 밴드에 합류해 주세요!' })
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

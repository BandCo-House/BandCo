import { IsEnum, IsString, Matches } from 'class-validator';

import { BandSpaceMemberRole } from '../../../generated/prisma';
import type { SpaceMemberRole } from '../types/band-space-list-item.type';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 합주 공간 멤버 추가 요청 본문을 검증한다.
 */
export class AddSpaceMemberBodyDto {
  @IsString({
    message: stringValidationMessage,
  })
  @Matches(UUID_PATTERN, {
    message: uuidValidationMessage,
  })
  userId!: string;

  @IsString({
    message: stringValidationMessage,
  })
  @IsEnum(BandSpaceMemberRole, {
    message: enumValidationMessage,
  })
  role: SpaceMemberRole = BandSpaceMemberRole.MEMBER;
}

export type AddSpaceMemberInput = AddSpaceMemberBodyDto;

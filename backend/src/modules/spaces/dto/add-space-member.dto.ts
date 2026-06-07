import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Matches } from 'class-validator';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';

import { BandSpaceMemberRole } from '../../../generated/prisma';
import type { SpaceMemberRole } from '../types/band-space-list-item.type';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 합주 공간 멤버 추가 요청 본문을 검증한다.
 */
export class AddSpaceMemberBodyDto {
  @ApiProperty({ description: '밴드 멤버 ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsString({
    message: stringValidationMessage,
  })
  @Matches(UUID_PATTERN, {
    message: uuidValidationMessage,
  })
  bandMemberId!: string;

  @ApiProperty({ enum: BandSpaceMemberRole, description: '합주 공간 내 역할', default: 'MEMBER', example: 'MEMBER' })
  @IsString({
    message: stringValidationMessage,
  })
  @IsEnum(BandSpaceMemberRole, {
    message: enumValidationMessage,
  })
  role: SpaceMemberRole = BandSpaceMemberRole.MEMBER;
}

export type AddSpaceMemberInput = AddSpaceMemberBodyDto;

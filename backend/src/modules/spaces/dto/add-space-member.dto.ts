import { IsEnum, IsString, Matches } from 'class-validator';

import { BandSpaceMemberRole } from '../../../generated/prisma';
import type { SpaceMemberRole } from '../types/band-space-list-item.type';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 합주 공간 멤버 추가 요청 본문을 검증한다.
 */
export class AddSpaceMemberBodyDto {
  @IsString({
    message: 'userId는 UUID 문자열이어야 합니다.',
  })
  @Matches(UUID_PATTERN, {
    message: 'userId는 올바른 UUID 형식이어야 합니다.',
  })
  userId!: string;

  @IsString({
    message: 'role은 문자열이어야 합니다.',
  })
  @IsEnum(BandSpaceMemberRole, {
    message: 'role은 허용된 값만 사용할 수 있습니다.',
  })
  role: SpaceMemberRole = BandSpaceMemberRole.MEMBER;
}

export type AddSpaceMemberInput = AddSpaceMemberBodyDto;

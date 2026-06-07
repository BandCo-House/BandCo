import { IsEnum, IsString } from 'class-validator';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

import { BandSpaceMemberRole } from '../../../generated/prisma';
import type { SpaceMemberRole } from '../types/band-space-list-item.type';

/**
 * 합주 공간 멤버 역할 수정 요청 본문을 검증한다.
 */
export class UpdateBandSpaceMemberRoleBodyDto {
  @IsString({ message: stringValidationMessage })
  @IsEnum(BandSpaceMemberRole, { message: enumValidationMessage })
  role: SpaceMemberRole = BandSpaceMemberRole.MEMBER;
}

export type UpdateBandSpaceMemberRoleInput = UpdateBandSpaceMemberRoleBodyDto;

import { IsEnum, IsString } from 'class-validator';

import { enumValidationMessage } from '../../../common/validation-message/enum-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';
import { BandMemberRole } from '../../../generated/prisma';

/**
 * 밴드 멤버 권한 변경 요청 본문을 검증한다.
 */
export class UpdateBandMemberRoleBodyDto {
  @IsString({
    message: stringValidationMessage,
  })
  @IsEnum(BandMemberRole, {
    message: enumValidationMessage,
  })
  role!: BandMemberRole;
}

export type UpdateBandMemberRoleInput = UpdateBandMemberRoleBodyDto;

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, ValidateIf } from 'class-validator';

import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';

/**
 * 팀 멤버의 세션 배정을 바꾼다.
 *
 * null은 "세션 미배정으로 되돌린다"는 뜻이라 undefined(생략)와 구분해야 한다.
 * @IsOptional()은 둘을 똑같이 건너뛰므로 @ValidateIf로 undefined만 통과시킨다.
 */
export class UpdateTeamMemberSessionBodyDto {
  @ApiPropertyOptional({
    description: '이 팀에서 맡을 세션 ID (UUID). null이면 세션 미배정으로 되돌린다.',
    nullable: true,
  })
  @ValidateIf((_object, value) => value !== null)
  @IsOptional()
  @IsUUID(undefined, { message: uuidValidationMessage })
  skillTypeId?: string | null;
}

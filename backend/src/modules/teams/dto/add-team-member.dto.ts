import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';

export class AddTeamMemberBodyDto {
  @ApiProperty({ description: '팀에 추가할 밴드 멤버 ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID(undefined, { message: uuidValidationMessage })
  bandMemberId!: string;
}

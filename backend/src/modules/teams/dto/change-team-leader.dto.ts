import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';

export class ChangeTeamLeaderBodyDto {
  @ApiProperty({ description: '새 팀 리더로 지정할 팀 멤버 ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID(undefined, { message: uuidValidationMessage })
  teamMemberId!: string;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';

export class AddTeamMemberBodyDto {
  @ApiProperty({ description: '팀에 추가할 밴드 멤버 ID', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID(undefined, { message: uuidValidationMessage })
  bandMemberId!: string;

  @ApiPropertyOptional({
    description: '이 팀에서 맡을 세션 ID (UUID). 같은 멤버를 다른 세션으로 여러 번 추가할 수 있다.',
  })
  @IsOptional()
  @IsUUID(undefined, { message: uuidValidationMessage })
  skillTypeId?: string;
}

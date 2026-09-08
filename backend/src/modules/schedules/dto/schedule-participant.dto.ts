import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';

/**
 * 일정 참여자 한 명. 합주는 세션(skillTypeId)까지 함께 배정한다.
 * 한 사람이 보컬·기타를 겸할 수 있어 같은 bandMemberId가 여러 번 올 수 있다.
 */
export class ScheduleParticipantInputDto {
  @ApiProperty({ description: '참여자 밴드 멤버 ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID('4', { message: uuidValidationMessage })
  bandMemberId!: string;

  @ApiPropertyOptional({ description: '이 일정에서 맡은 세션 ID (UUID). 합주 전용이며 회의는 생략한다.' })
  @IsOptional()
  @IsUUID('4', { message: uuidValidationMessage })
  skillTypeId?: string;
}

export type ScheduleParticipantInput = ScheduleParticipantInputDto;

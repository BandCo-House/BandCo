import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';

import { SCHEDULE_POLL_OPTION_MAX_COUNT } from './create-schedule-poll.dto';

export class UpdateSchedulePollVoteBodyDto {
  @ApiProperty({
    description: '선택할 후보 시간 ID 목록. 빈 배열이면 기존 투표를 철회한다.',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsArray()
  @ArrayMaxSize(SCHEDULE_POLL_OPTION_MAX_COUNT, { message: `후보 시간은 최대 ${SCHEDULE_POLL_OPTION_MAX_COUNT}개까지 선택할 수 있습니다.` })
  @IsUUID('4', { each: true, message: uuidValidationMessage })
  schedulePollOptionIds!: string[];
}

export type UpdateSchedulePollVoteInput = UpdateSchedulePollVoteBodyDto;

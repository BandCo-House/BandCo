import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';

export class UpdateSchedulePollVoteBodyDto {
  @ApiProperty({
    description: '선택할 후보 시간 ID 목록. 빈 배열이면 기존 투표를 철회한다.',
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440000'],
  })
  @IsArray()
  @IsUUID('4', { each: true, message: uuidValidationMessage })
  schedulePollOptionIds!: string[];
}

export type UpdateSchedulePollVoteInput = UpdateSchedulePollVoteBodyDto;

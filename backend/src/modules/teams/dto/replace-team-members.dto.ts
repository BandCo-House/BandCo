import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';

import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';

export class ReplaceTeamMemberItemDto {
  @ApiPropertyOptional({
    description: '기존 팀 멤버 행 ID. 보내면 그 행을 이어받아 joinedAt·teamRole을 유지한다. 새로 추가하는 행은 생략한다.',
  })
  @IsOptional()
  @IsUUID(undefined, { message: uuidValidationMessage })
  teamMemberId?: string;

  @ApiProperty({ description: '이 자리에 앉는 밴드 멤버 ID' })
  @IsUUID(undefined, { message: uuidValidationMessage })
  bandMemberId!: string;

  @ApiPropertyOptional({ description: '이 팀에서 맡을 세션 ID. 미배정이면 생략하거나 null.' })
  @IsOptional()
  @IsUUID(undefined, { message: uuidValidationMessage })
  skillTypeId?: string | null;
}

export class ReplaceTeamMembersBodyDto {
  @ApiProperty({
    description: '교체 후 팀 명단 전체. 여기 없는 기존 행은 삭제된다.',
    type: [ReplaceTeamMemberItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReplaceTeamMemberItemDto)
  members!: ReplaceTeamMemberItemDto[];
}

export interface ReplaceTeamMemberInput {
  teamMemberId?: string;
  bandMemberId: string;
  skillTypeId?: string | null;
}

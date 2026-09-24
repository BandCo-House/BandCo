import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsISO8601, IsString, ValidateNested } from 'class-validator';

import { iso8601ValidationMessage } from '../../../common/validation-message/iso8601-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';

/** 후보가 과도하게 많으면 상세 조회 응답과 투표 화면이 비대해지므로 상한을 둔다. */
export const SCHEDULE_POLL_OPTION_MAX_COUNT = 20;

export class CreateSchedulePollOptionDto {
  @ApiProperty({ description: '후보 시작 일시', example: '2026-09-13T21:00:00+09:00' })
  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  startAt!: string;

  @ApiProperty({ description: '후보 종료 일시', example: '2026-09-13T23:00:00+09:00' })
  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  endAt!: string;
}

export class CreateSchedulePollBodyDto {
  @ApiProperty({ description: `일정 조율 후보 시간 목록 (1~${SCHEDULE_POLL_OPTION_MAX_COUNT}개)`, type: [CreateSchedulePollOptionDto] })
  @IsArray()
  @ArrayMinSize(1, { message: '후보 시간은 한 개 이상 필요합니다.' })
  @ArrayMaxSize(SCHEDULE_POLL_OPTION_MAX_COUNT, { message: `후보 시간은 최대 ${SCHEDULE_POLL_OPTION_MAX_COUNT}개까지 등록할 수 있습니다.` })
  @ValidateNested({ each: true })
  @Type(() => CreateSchedulePollOptionDto)
  options!: CreateSchedulePollOptionDto[];
}

export type CreateSchedulePollInput = CreateSchedulePollBodyDto;

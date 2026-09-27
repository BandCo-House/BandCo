import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsISO8601, IsNotEmpty, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';

import { iso8601ValidationMessage } from '../../../common/validation-message/iso8601-validation.message';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { matchValidationMessage } from '../../../common/validation-message/match-validation.message';
import { notemptyValidationMessage } from '../../../common/validation-message/notempty-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';

/** 공백만으로 된 이름을 거른다. IsNotEmpty는 ''만 막고 '   '는 통과시킨다. */
const NON_BLANK_PATTERN = /\S/;

/** 후보가 과도하게 많으면 상세 조회 응답과 투표 화면이 비대해지므로 상한을 둔다. */
export const SCHEDULE_POLL_OPTION_MAX_COUNT = 20;

/** 투표 이름 최대 길이(schedule_polls.name VarChar(50)과 일치). */
export const SCHEDULE_POLL_NAME_MAX_LENGTH = 50;

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
  @ApiProperty({ description: '일정 투표 이름', example: '좋은 날 오프닝 연습' })
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  @Matches(NON_BLANK_PATTERN, { message: matchValidationMessage })
  @MaxLength(SCHEDULE_POLL_NAME_MAX_LENGTH, { message: lengthValidationMessage })
  name!: string;

  @ApiProperty({ description: '투표 마감 일시 (현재 시각 이후)', example: '2026-10-05T19:00:00+09:00' })
  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  closesAt!: string;

  @ApiProperty({ description: `일정 조율 후보 시간 목록 (1~${SCHEDULE_POLL_OPTION_MAX_COUNT}개)`, type: [CreateSchedulePollOptionDto] })
  @IsArray()
  @ArrayMinSize(1, { message: '후보 시간은 한 개 이상 필요합니다.' })
  @ArrayMaxSize(SCHEDULE_POLL_OPTION_MAX_COUNT, { message: `후보 시간은 최대 ${SCHEDULE_POLL_OPTION_MAX_COUNT}개까지 등록할 수 있습니다.` })
  @ValidateNested({ each: true })
  @Type(() => CreateSchedulePollOptionDto)
  options!: CreateSchedulePollOptionDto[];
}

export type CreateSchedulePollInput = CreateSchedulePollBodyDto;

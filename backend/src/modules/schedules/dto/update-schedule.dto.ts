import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { iso8601ValidationMessage } from 'src/common/validation-message/iso8601-validation.message';
import { notemptyValidationMessage } from 'src/common/validation-message/notempty-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';

import { trimStringValue } from '../../../common/validation/transform.util';
import { ScheduleStatus, ScheduleType } from '../../../generated/prisma';

import { ScheduleParticipantInputDto } from './schedule-participant.dto';
import { ScheduleReferenceFileDto } from './schedule-reference-file.dto';

/**
 * 일정 수정 요청 본문을 검증한다. 모든 필드는 선택이며 전달된 필드만 업데이트된다.
 */
export class UpdateScheduleBodyDto {
  @IsOptional()
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  title?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsEnum(ScheduleType, { message: enumValidationMessage })
  scheduleType?: ScheduleType;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  startAt?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  endAt?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsUUID('4', { message: uuidValidationMessage })
  placeId?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsEnum(ScheduleStatus, { message: enumValidationMessage })
  status?: ScheduleStatus;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: uuidValidationMessage })
  songIds?: string[];

  @ApiPropertyOptional({ description: '참여자 밴드 멤버 ID 목록 (deprecated — participants를 쓴다)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: uuidValidationMessage })
  participantBandMemberIds?: string[];

  @ApiPropertyOptional({
    description: '참여자 목록(세션 포함, 전달 시 전체 교체). participantBandMemberIds와 함께 오면 이쪽이 우선한다.',
    type: [ScheduleParticipantInputDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleParticipantInputDto)
  participants?: ScheduleParticipantInputDto[];

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  memo?: string;

  @ApiPropertyOptional({ description: '일정 관련 외부 링크 목록 (전달 시 전체 교체)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: stringValidationMessage })
  @IsNotEmpty({ each: true, message: notemptyValidationMessage })
  externalLinks?: string[];

  @ApiPropertyOptional({ description: '일정 참고자료 파일 목록 (전달 시 전체 교체)', type: [ScheduleReferenceFileDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleReferenceFileDto)
  referenceFiles?: ScheduleReferenceFileDto[];
}

export type UpdateScheduleInput = UpdateScheduleBodyDto;

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

import { ScheduleReferenceFileDto } from './schedule-reference-file.dto';

/**
 * 일정 생성 요청 본문을 검증한다.
 */
export class CreateScheduleBodyDto {
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  title!: string;

  @IsString({ message: stringValidationMessage })
  @IsEnum(ScheduleType, { message: enumValidationMessage })
  scheduleType!: ScheduleType;

  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  startAt!: string;

  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  endAt!: string;

  @IsString({ message: stringValidationMessage })
  @IsEnum(ScheduleStatus, { message: enumValidationMessage })
  status!: ScheduleStatus;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsUUID('4', { message: uuidValidationMessage })
  placeId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: uuidValidationMessage })
  songIds?: string[];

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: uuidValidationMessage })
  participantBandMemberIds?: string[];

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsUUID('4', { message: uuidValidationMessage })
  teamId?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  memo?: string;

  @ApiPropertyOptional({ description: '일정 관련 외부 링크 목록', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: stringValidationMessage })
  @IsNotEmpty({ each: true, message: notemptyValidationMessage })
  externalLinks?: string[];

  @ApiPropertyOptional({ description: '일정 참고자료 파일 목록', type: [ScheduleReferenceFileDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleReferenceFileDto)
  referenceFiles?: ScheduleReferenceFileDto[];
}

export type CreateScheduleInput = CreateScheduleBodyDto;

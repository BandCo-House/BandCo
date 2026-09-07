import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsISO8601, IsString, ValidateNested } from 'class-validator';

import { iso8601ValidationMessage } from '../../../common/validation-message/iso8601-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';

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
  @ApiProperty({ description: '일정 조율 후보 시간 목록', type: [CreateSchedulePollOptionDto] })
  @IsArray()
  @ArrayMinSize(1, { message: '후보 시간은 한 개 이상 필요합니다.' })
  @ValidateNested({ each: true })
  @Type(() => CreateSchedulePollOptionDto)
  options!: CreateSchedulePollOptionDto[];
}

export type CreateSchedulePollInput = CreateSchedulePollBodyDto;

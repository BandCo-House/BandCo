import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsISO8601, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { intValidationMessage } from 'src/common/validation-message/int-validation.message';
import { iso8601ValidationMessage } from 'src/common/validation-message/iso8601-validation.message';
import { minValidationMessage } from 'src/common/validation-message/min-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';

import { ScheduleStatus, ScheduleType } from '../../../generated/prisma';

/**
 * 일정 목록 조회 쿼리 파라미터를 검증한다. cursor 기반 페이지네이션을 사용한다.
 */
export class GetSchedulesQueryDto {
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  cursor__start_at?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsUUID('4', { message: uuidValidationMessage })
  cursor__id?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  take?: number = 50;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  where__start_at__greater__than_equal?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  where__start_at__less_than_equal?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsUUID('4', { message: uuidValidationMessage })
  where__place_id?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsEnum(ScheduleType, { message: enumValidationMessage })
  where__schedule_type?: ScheduleType;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsEnum(ScheduleStatus, { message: enumValidationMessage })
  where__status?: ScheduleStatus;
}

export type GetSchedulesQuery = GetSchedulesQueryDto;

import { Transform } from 'class-transformer';
import { IsEnum, IsISO8601, IsNotEmpty, IsString, Matches, Validate } from 'class-validator';

import { EndDateNotBeforeStartDateConstraint } from '../../../common/validation/date-order.validator';
import { trimStringValue } from '../../../common/validation/transform.util';
import type { SpaceStatus, SpaceType } from '../types/band-space-list-item.type';

const ALLOWED_SPACE_TYPES: readonly SpaceType[] = ['PRACTICE_ROOM', 'STUDIO', 'ONLINE', 'ETC'] as const;
const ALLOWED_SPACE_STATUSES: readonly SpaceStatus[] = ['ACTIVE', 'INACTIVE'] as const;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 합주 공간 생성 요청 본문을 검증한다.
 */
export class CreateBandSpaceBodyDto {
  @Transform(trimStringValue)
  @IsString({
    message: 'name는 문자열이어야 합니다.',
  })
  @IsNotEmpty({
    message: 'name는 비어 있을 수 없습니다.',
  })
  name!: string;

  @Transform(trimStringValue)
  @IsString({
    message: 'description는 문자열이어야 합니다.',
  })
  @IsNotEmpty({
    message: 'description는 비어 있을 수 없습니다.',
  })
  description!: string;

  @IsString({
    message: 'spaceType는 문자열이어야 합니다.',
  })
  @IsEnum(ALLOWED_SPACE_TYPES, {
    message: 'spaceType는 허용된 값만 사용할 수 있습니다.',
  })
  spaceType!: SpaceType;

  @IsString({
    message: 'status는 문자열이어야 합니다.',
  })
  @IsEnum(ALLOWED_SPACE_STATUSES, {
    message: 'status는 허용된 값만 사용할 수 있습니다.',
  })
  status!: SpaceStatus;

  @Transform(trimStringValue)
  @IsString({
    message: 'startDate는 yyyy-mm-dd 문자열이어야 합니다.',
  })
  @IsNotEmpty({
    message: 'startDate는 비어 있을 수 없습니다.',
  })
  @Matches(DATE_ONLY_PATTERN, {
    message: 'startDate는 yyyy-mm-dd 형식이어야 합니다.',
  })
  @IsISO8601(
    {
      strict: true,
      strictSeparator: true,
    },
    {
      message: 'startDate가 올바른 날짜가 아닙니다.',
    },
  )
  startDate!: string;

  @Transform(trimStringValue)
  @IsString({
    message: 'endDate는 yyyy-mm-dd 문자열이어야 합니다.',
  })
  @IsNotEmpty({
    message: 'endDate는 비어 있을 수 없습니다.',
  })
  @Matches(DATE_ONLY_PATTERN, {
    message: 'endDate는 yyyy-mm-dd 형식이어야 합니다.',
  })
  @IsISO8601(
    {
      strict: true,
      strictSeparator: true,
    },
    {
      message: 'endDate가 올바른 날짜가 아닙니다.',
    },
  )
  @Validate(EndDateNotBeforeStartDateConstraint)
  endDate!: string;
}

export type CreateBandSpaceInput = CreateBandSpaceBodyDto;

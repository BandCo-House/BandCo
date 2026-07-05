import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsISO8601, IsNotEmpty, IsOptional, IsString, Matches, Validate } from 'class-validator';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { iso8601ValidationMessage } from 'src/common/validation-message/iso8601-validation.message';
import { matchValidationMessage } from 'src/common/validation-message/match-validation.message';
import { notemptyValidationMessage } from 'src/common/validation-message/notempty-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

import { EndDateNotBeforeStartDateConstraint } from '../../../common/validation/date-order.validator';
import { trimStringValue } from '../../../common/validation/transform.util';
import { BandSpaceStatus, BandSpaceType } from '../../../generated/prisma';
import type { SpaceStatus, SpaceType } from '../types/band-space-list-item.type';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 합주 공간 생성 요청 본문을 검증한다.
 */
export class CreateBandSpaceBodyDto {
  @ApiProperty({ description: '합주 공간 이름', example: '강남 연습실' })
  @Transform(trimStringValue)
  @IsString({
    message: stringValidationMessage,
  })
  @IsNotEmpty({
    message: notemptyValidationMessage,
  })
  name!: string;

  @ApiPropertyOptional({ description: '합주 공간 설명(선택)', example: '드럼 세트 완비, 주차 가능' })
  @Transform(trimStringValue)
  @IsOptional()
  @IsString({
    message: stringValidationMessage,
  })
  description?: string;

  @ApiProperty({ enum: BandSpaceType, description: '합주 공간 유형', example: 'PRACTICE' })
  @IsString({
    message: stringValidationMessage,
  })
  @IsEnum(BandSpaceType, {
    message: enumValidationMessage,
  })
  spaceType!: SpaceType;

  @ApiProperty({ enum: BandSpaceStatus, description: '합주 공간 상태', example: 'ACTIVE' })
  @IsString({
    message: stringValidationMessage,
  })
  @IsEnum(BandSpaceStatus, {
    message: enumValidationMessage,
  })
  status!: SpaceStatus;

  @ApiProperty({ description: '시작일 (YYYY-MM-DD)', example: '2024-07-01' })
  @Transform(trimStringValue)
  @IsString({
    message: stringValidationMessage,
  })
  @IsNotEmpty({
    message: notemptyValidationMessage,
  })
  @Matches(DATE_ONLY_PATTERN, {
    message: matchValidationMessage,
  })
  @IsISO8601(
    {
      strict: true,
      strictSeparator: true,
    },
    {
      message: iso8601ValidationMessage,
    },
  )
  startDate!: string;

  @ApiProperty({ description: '종료일 (YYYY-MM-DD, 시작일 이후)', example: '2024-07-31' })
  @Transform(trimStringValue)
  @IsString({
    message: stringValidationMessage,
  })
  @IsNotEmpty({
    message: notemptyValidationMessage,
  })
  @Matches(DATE_ONLY_PATTERN, {
    message: matchValidationMessage,
  })
  @IsISO8601(
    {
      strict: true,
      strictSeparator: true,
    },
    {
      message: iso8601ValidationMessage,
    },
  )
  @Validate(EndDateNotBeforeStartDateConstraint)
  endDate!: string;
}

export type CreateBandSpaceInput = CreateBandSpaceBodyDto;

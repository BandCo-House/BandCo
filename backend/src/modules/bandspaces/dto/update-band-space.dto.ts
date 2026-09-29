import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsISO8601, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { iso8601ValidationMessage } from 'src/common/validation-message/iso8601-validation.message';
import { matchValidationMessage } from 'src/common/validation-message/match-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';

import { trimStringValue } from '../../../common/validation/transform.util';
import { BandSpaceStatus, BandSpaceType } from '../../../generated/prisma';
import type { SpaceStatus, SpaceType } from '../types/band-space-list-item.type';

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 합주 공간 수정 요청 본문을 검증한다. 전달된 필드만 업데이트된다.
 */
export class UpdateBandSpaceBodyDto {
  @IsOptional()
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  name?: string;

  @IsOptional()
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  description?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsEnum(BandSpaceType, { message: enumValidationMessage })
  spaceType?: SpaceType;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsEnum(BandSpaceStatus, { message: enumValidationMessage })
  status?: SpaceStatus;

  @IsOptional()
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @Matches(DATE_ONLY_PATTERN, { message: matchValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  startDate?: string;

  @IsOptional()
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @Matches(DATE_ONLY_PATTERN, { message: matchValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  endDate?: string;

  @ApiPropertyOptional({
    description: '합주 공간 참여 멤버의 밴드 멤버 ID 목록 (전달 시 전체 교체, LEADER는 유지)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true, message: uuidValidationMessage })
  bandMemberIds?: string[];
}

export type UpdateBandSpaceInput = UpdateBandSpaceBodyDto;

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { booleanValidationMessage } from 'src/common/validation-message/boolean-validation.message';
import { intValidationMessage } from 'src/common/validation-message/int-validation.message';
import { minValidationMessage } from 'src/common/validation-message/min-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

import {
  normalizeOptionalStringValue,
  parseOptionalBooleanValue,
  parseOptionalPositiveIntegerValue,
} from '../../../common/validation/transform.util';

/**
 * 합주 공간 목록 조회 쿼리를 검증하고 서비스에서 바로 쓸 수 있는 형태로 만든다.
 */
export class GetBandSpacesQueryDto {
  @ApiPropertyOptional({ description: '공간 이름 검색어', example: '강남' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: stringValidationMessage,
  })
  query?: string;

  @ApiPropertyOptional({ description: '내가 참여하는 공간만 조회', example: false })
  @Transform(parseOptionalBooleanValue)
  @IsOptional()
  @IsBoolean({
    message: booleanValidationMessage,
  })
  onlyMine?: boolean;

  @ApiPropertyOptional({ description: '진행 중인 공간만 조회', example: false })
  @Transform(parseOptionalBooleanValue)
  @IsOptional()
  @IsBoolean({
    message: booleanValidationMessage,
  })
  inProgressOnly?: boolean;

  @ApiPropertyOptional({ description: '페이지 번호', default: 1, minimum: 1 })
  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({
    message: intValidationMessage,
  })
  @Min(1, {
    message: minValidationMessage,
  })
  page: number = 1;

  @ApiPropertyOptional({ description: '페이지당 항목 수', default: 20, minimum: 1 })
  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({
    message: intValidationMessage,
  })
  @Min(1, {
    message: minValidationMessage,
  })
  size: number = 20;

  @ApiPropertyOptional({ description: '정렬 기준', example: 'createdAt:desc' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: stringValidationMessage,
  })
  sort?: string;
}

export type GetBandSpacesQuery = GetBandSpacesQueryDto;

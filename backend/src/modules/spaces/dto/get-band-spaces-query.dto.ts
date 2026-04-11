import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

import {
  normalizeOptionalStringValue,
  parseOptionalBooleanValue,
  parseOptionalPositiveIntegerValue,
} from '../../../common/validation/transform.util';

/**
 * 합주 공간 목록 조회 쿼리를 검증하고 서비스에서 바로 쓸 수 있는 형태로 만든다.
 */
export class GetBandSpacesQueryDto {
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: 'query는 문자열이어야 합니다.',
  })
  query?: string;

  @Transform(parseOptionalBooleanValue)
  @IsOptional()
  @IsBoolean({
    message: 'onlyMine는 true 또는 false 여야 합니다.',
  })
  onlyMine?: boolean;

  @Transform(parseOptionalBooleanValue)
  @IsOptional()
  @IsBoolean({
    message: 'inProgressOnly는 true 또는 false 여야 합니다.',
  })
  inProgressOnly?: boolean;

  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({
    message: 'page는 1 이상의 정수여야 합니다.',
  })
  @Min(1, {
    message: 'page는 1 이상의 정수여야 합니다.',
  })
  page: number = 1;

  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({
    message: 'size는 1 이상의 정수여야 합니다.',
  })
  @Min(1, {
    message: 'size는 1 이상의 정수여야 합니다.',
  })
  size: number = 20;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: 'sort는 문자열이어야 합니다.',
  })
  sort?: string;
}

export type GetBandSpacesQuery = GetBandSpacesQueryDto;

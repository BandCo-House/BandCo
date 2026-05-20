import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, ValidateIf } from 'class-validator';

import { normalizeOptionalStringValue, trimStringValue } from '../../../common/validation/transform.util';
import { enumValidationMessage } from '../../../common/validation-message/enum-validation.message';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { notemptyValidationMessage } from '../../../common/validation-message/notempty-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';
import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';
import type { SongSourceType } from '../types/song-preview.type';

import { SONG_SOURCE_TYPES } from './create-song.dto';

/**
 * 곡 수정 요청 본문은 PATCH 의미에 맞춰 전달된 필드만 검증한다.
 */
export class UpdateSongBodyDto {
  @Transform(trimStringValue)
  @ValidateIf((_, value) => value !== undefined)
  @IsString({
    message: stringValidationMessage,
  })
  @IsNotEmpty({
    message: notemptyValidationMessage,
  })
  @MaxLength(200, {
    message: lengthValidationMessage,
  })
  title?: string;

  @Transform(trimStringValue)
  @ValidateIf((_, value) => value !== undefined)
  @IsString({
    message: stringValidationMessage,
  })
  @IsNotEmpty({
    message: notemptyValidationMessage,
  })
  @MaxLength(200, {
    message: lengthValidationMessage,
  })
  artistName?: string;

  @Transform(normalizeOptionalStringValue)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString({
    message: stringValidationMessage,
  })
  sourceUrl?: string | null;

  @IsOptional()
  @IsEnum(SONG_SOURCE_TYPES, {
    message: enumValidationMessage,
  })
  sourceType?: SongSourceType | null;

  @Transform(normalizeOptionalStringValue)
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString({
    message: stringValidationMessage,
  })
  memo?: string | null;

  @IsOptional()
  @IsArray()
  @IsUUID('4', {
    each: true,
    message: uuidValidationMessage,
  })
  skillTypeIds?: string[];
}

export type UpdateSongInput = UpdateSongBodyDto;

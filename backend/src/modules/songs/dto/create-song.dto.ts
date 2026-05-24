import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { normalizeOptionalStringValue, trimStringValue } from '../../../common/validation/transform.util';
import { enumValidationMessage } from '../../../common/validation-message/enum-validation.message';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { notemptyValidationMessage } from '../../../common/validation-message/notempty-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';
import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';
import type { SongSourceType } from '../types/song-preview.type';

export const SONG_SOURCE_TYPES = ['SPOTIFY', 'DEEZER'] as const satisfies readonly SongSourceType[];

/**
 * 곡 생성 요청 본문을 검증한다.
 */
export class CreateSongBodyDto {
  @Transform(trimStringValue)
  @IsString({
    message: stringValidationMessage,
  })
  @IsNotEmpty({
    message: notemptyValidationMessage,
  })
  @MaxLength(200, {
    message: lengthValidationMessage,
  })
  title!: string;

  @Transform(trimStringValue)
  @IsString({
    message: stringValidationMessage,
  })
  @IsNotEmpty({
    message: notemptyValidationMessage,
  })
  @MaxLength(200, {
    message: lengthValidationMessage,
  })
  artistName!: string;

  @Transform(trimStringValue)
  @IsString({
    message: stringValidationMessage,
  })
  @IsNotEmpty({
    message: notemptyValidationMessage,
  })
  sourceUrl!: string;

  @IsEnum(SONG_SOURCE_TYPES, {
    message: enumValidationMessage,
  })
  sourceType!: SongSourceType;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: stringValidationMessage,
  })
  memo?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', {
    each: true,
    message: uuidValidationMessage,
  })
  skillTypeIds?: string[];
}

export type CreateSongInput = CreateSongBodyDto;

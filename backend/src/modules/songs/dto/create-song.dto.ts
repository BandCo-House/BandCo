import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, Min, ValidateNested } from 'class-validator';

import { normalizeOptionalStringValue, trimStringValue } from '../../../common/validation/transform.util';
import { enumValidationMessage } from '../../../common/validation-message/enum-validation.message';
import { intValidationMessage } from '../../../common/validation-message/int-validation.message';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { minValidationMessage } from '../../../common/validation-message/min-validation.message';
import { notemptyValidationMessage } from '../../../common/validation-message/notempty-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';
import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';
import type { SongSourceType } from '../types/song-preview.type';

import { SongReferenceFileDto } from './song-reference-file.dto';

export const SONG_SOURCE_TYPES = ['SPOTIFY', 'DEEZER'] as const satisfies readonly SongSourceType[];

/**
 * 곡 생성 요청 본문을 검증한다.
 */
export class CreateSongBodyDto {
  @ApiProperty({ description: '곡 제목 (최대 200자)', example: 'Bohemian Rhapsody' })
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

  @ApiProperty({ description: '아티스트 이름 (최대 200자)', example: 'Queen' })
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

  @ApiProperty({ description: '음원 URL', example: 'https://open.spotify.com/track/...' })
  @Transform(trimStringValue)
  @IsString({
    message: stringValidationMessage,
  })
  @IsNotEmpty({
    message: notemptyValidationMessage,
  })
  sourceUrl!: string;

  @ApiProperty({ enum: SONG_SOURCE_TYPES, description: '음원 출처', example: 'SPOTIFY' })
  @IsEnum(SONG_SOURCE_TYPES, {
    message: enumValidationMessage,
  })
  sourceType!: SongSourceType;

  @ApiPropertyOptional({ description: '곡 메모', example: '인트로 부분 연습 필요' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: stringValidationMessage,
  })
  memo?: string;

  @ApiPropertyOptional({ description: '스킬 타입 ID 목록 (UUID 배열)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', {
    each: true,
    message: uuidValidationMessage,
  })
  skillTypeIds?: string[];

  @ApiPropertyOptional({ description: '곡 커버 이미지 URL', example: 'https://.../song-covers/uuid.jpg' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: stringValidationMessage,
  })
  songCoverUrl?: string;

  @ApiPropertyOptional({ description: '곡 길이 (초 단위)', example: 355 })
  @IsOptional()
  @IsInt({
    message: intValidationMessage,
  })
  @Min(1, {
    message: minValidationMessage,
  })
  songLength?: number;

  @ApiPropertyOptional({ description: '외부 링크 URL 목록', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({
    each: true,
    message: stringValidationMessage,
  })
  externalLinks?: string[];

  @ApiPropertyOptional({ description: '참고자료 파일 목록', type: [SongReferenceFileDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SongReferenceFileDto)
  referenceFiles?: SongReferenceFileDto[];
}

export type CreateSongInput = CreateSongBodyDto;

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateIf, ValidateNested } from 'class-validator';

import { normalizeOptionalStringValue, trimStringValue } from '../../../common/validation/transform.util';
import { enumValidationMessage } from '../../../common/validation-message/enum-validation.message';
import { intValidationMessage } from '../../../common/validation-message/int-validation.message';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { maxValidationMessage } from '../../../common/validation-message/max-validation.message';
import { minValidationMessage } from '../../../common/validation-message/min-validation.message';
import { notemptyValidationMessage } from '../../../common/validation-message/notempty-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';
import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';
import { SongKey } from '../../../generated/prisma';
import type { SongSourceType } from '../types/song-preview.type';

import { SongReferenceFileDto } from './song-reference-file.dto';

export const SONG_SOURCE_TYPES = ['SPOTIFY', 'DEEZER'] as const satisfies readonly SongSourceType[];

export const SONG_KEYS = Object.values(SongKey);

/** SmallInt 컬럼 상한. 넘기면 DB에서 터지므로 검증 단계에서 막는다. */
export const SMALL_INT_MAX = 32767;

/**
 * 외부 검색으로 등록한 곡은 음원 URL·출처·트랙 ID가 한 벌로 들어온다.
 * 하나라도 오면 나머지도 필수로 봐서 반쪽짜리 출처가 저장되지 않게 한다.
 */
const hasAnyExternalSource = (dto: { sourceUrl?: string; sourceType?: SongSourceType; externalTrackId?: string }): boolean =>
  dto.sourceUrl !== undefined || dto.sourceType !== undefined || dto.externalTrackId !== undefined;

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

  @ApiPropertyOptional({ description: '음원 URL (외부 검색으로 등록한 곡만 존재)', example: 'https://open.spotify.com/track/...' })
  @Transform(normalizeOptionalStringValue)
  @ValidateIf(hasAnyExternalSource)
  @IsString({
    message: stringValidationMessage,
  })
  @IsNotEmpty({
    message: notemptyValidationMessage,
  })
  sourceUrl?: string;

  @ApiPropertyOptional({ enum: SONG_SOURCE_TYPES, description: '음원 출처 (외부 검색으로 등록한 곡만 존재)', example: 'SPOTIFY' })
  @ValidateIf(hasAnyExternalSource)
  @IsEnum(SONG_SOURCE_TYPES, {
    message: enumValidationMessage,
  })
  sourceType?: SongSourceType;

  @ApiPropertyOptional({ enum: SONG_KEYS, description: '조성', example: 'FSM' })
  @IsOptional()
  @IsEnum(SONG_KEYS, {
    message: enumValidationMessage,
  })
  key?: SongKey;

  @ApiPropertyOptional({ description: 'BPM', example: 120 })
  @IsOptional()
  @IsInt({
    message: intValidationMessage,
  })
  @Min(1, {
    message: minValidationMessage,
  })
  @Max(SMALL_INT_MAX, {
    message: maxValidationMessage,
  })
  bpm?: number;

  @ApiPropertyOptional({ description: 'Deezer 외부 트랙 ID (외부 검색으로 등록한 곡만 존재)', example: '3135556' })
  @Transform(normalizeOptionalStringValue)
  @ValidateIf(hasAnyExternalSource)
  @IsString({
    message: stringValidationMessage,
  })
  @IsNotEmpty({
    message: notemptyValidationMessage,
  })
  @MaxLength(255, {
    message: lengthValidationMessage,
  })
  externalTrackId?: string;

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
  @Max(SMALL_INT_MAX, {
    message: maxValidationMessage,
  })
  songLength?: number;

  @ApiPropertyOptional({ description: '외부 링크 URL 목록', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({
    each: true,
    message: stringValidationMessage,
  })
  @IsNotEmpty({
    each: true,
    message: notemptyValidationMessage,
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

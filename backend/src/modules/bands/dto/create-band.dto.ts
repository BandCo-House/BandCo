import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

import { normalizeOptionalStringValue, trimStringValue } from '../../../common/validation/transform.util';
import { booleanValidationMessage } from '../../../common/validation-message/boolean-validation.message';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { notemptyValidationMessage } from '../../../common/validation-message/notempty-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';
import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';

/**
 * 밴드 생성 요청 본문을 검증한다.
 */
export class CreateBandBodyDto {
  @ApiProperty({ description: '밴드 이름 (최대 40자)', example: '록밴드' })
  @Transform(trimStringValue)
  @IsString({
    message: stringValidationMessage,
  })
  @IsNotEmpty({
    message: notemptyValidationMessage,
  })
  @MaxLength(40, {
    message: lengthValidationMessage,
  })
  name!: string;

  @ApiPropertyOptional({ description: '밴드 소개', example: '함께 음악을 만들어가는 밴드입니다.' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: stringValidationMessage,
  })
  description?: string;

  @ApiProperty({ description: '밴드 공개 여부', example: true })
  @IsBoolean({
    message: booleanValidationMessage,
  })
  visibility!: boolean;

  @ApiPropertyOptional({ description: '밴드 커버 이미지 URL', example: 'https://example.com/cover.jpg' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: stringValidationMessage,
  })
  coverImgUrl?: string;

  @ApiPropertyOptional({ description: '장르 ID 목록 (UUID 배열)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', {
    each: true,
    message: uuidValidationMessage,
  })
  genreIds?: string[];

  @ApiPropertyOptional({ description: '초대할 유저 ID 목록 (UUID 배열)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', {
    each: true,
    message: uuidValidationMessage,
  })
  inviteeUserIds?: string[];
}

export type CreateBandInput = CreateBandBodyDto;

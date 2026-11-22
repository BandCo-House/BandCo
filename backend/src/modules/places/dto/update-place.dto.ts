import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

import { normalizeNullableStringValue, trimStringValue } from '../../../common/validation/transform.util';
import { coordinateValidationMessage } from '../../../common/validation-message/coordinate-validation.message';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { notemptyValidationMessage } from '../../../common/validation-message/notempty-validation.message';
import { numberValidationMessage } from '../../../common/validation-message/number-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';

/**
 * 장소 수정 요청 본문은 PATCH 의미에 맞춰 전달된 필드만 검증한다.
 * name을 뺀 나머지는 선택값이라 null을 보내면 지운다(@IsOptional이 null도 통과시킨다).
 */
export class UpdatePlaceBodyDto {
  @ApiPropertyOptional({ description: '장소 이름 (최대 120자). null로 지울 수 없다', example: '합정 연습실 B' })
  // name은 NOT NULL이라 @IsOptional을 쓰지 않는다. null이 검증을 통과하면 DB에서 500으로 터진다.
  @Transform(trimStringValue)
  @ValidateIf((_, value) => value !== undefined)
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  @MaxLength(120, { message: lengthValidationMessage })
  name?: string;

  @ApiPropertyOptional({
    description: '주소 (null로 설정 시 삭제). 바꾸면서 좌표를 안 보내면 이전 좌표도 비워진다',
    nullable: true,
    example: '서울 마포구 양화로 45',
  })
  @Transform(normalizeNullableStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(255, { message: lengthValidationMessage })
  address?: string | null;

  @ApiPropertyOptional({ description: '상세 위치 메모 (null로 설정 시 삭제)', nullable: true, example: '지하 1층 B룸' })
  @Transform(normalizeNullableStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(255, { message: lengthValidationMessage })
  detailAddress?: string | null;

  @ApiPropertyOptional({ description: '위도. address·longitude와 함께 보낸다', nullable: true, example: 37.5496 })
  @IsOptional()
  @IsNumber({}, { message: numberValidationMessage })
  @IsLatitude({ message: coordinateValidationMessage })
  latitude?: number | null;

  @ApiPropertyOptional({ description: '경도. latitude와 반드시 쌍으로 보낸다', nullable: true, example: 126.9139 })
  @IsOptional()
  @IsNumber({}, { message: numberValidationMessage })
  @IsLongitude({ message: coordinateValidationMessage })
  longitude?: number | null;

  @ApiPropertyOptional({ description: '커버 이미지 URL (null로 설정 시 삭제)', nullable: true, example: 'https://example.com/place.png' })
  @Transform(normalizeNullableStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(255, { message: lengthValidationMessage })
  imageUrl?: string | null;
}

export type UpdatePlaceInput = UpdatePlaceBodyDto;

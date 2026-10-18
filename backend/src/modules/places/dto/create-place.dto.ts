import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsLatitude, IsLongitude, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

import { normalizeOptionalStringValue, trimStringValue } from '../../../common/validation/transform.util';
import { coordinateValidationMessage } from '../../../common/validation-message/coordinate-validation.message';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { notemptyValidationMessage } from '../../../common/validation-message/notempty-validation.message';
import { numberValidationMessage } from '../../../common/validation-message/number-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';

/**
 * 장소 생성 요청 본문을 검증한다.
 */
export class CreatePlaceBodyDto {
  @ApiProperty({ description: '장소 이름 (최대 120자)', example: '합정 연습실 A' })
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  @MaxLength(120, { message: lengthValidationMessage })
  name!: string;

  @ApiPropertyOptional({ description: '주소 (최대 255자). 이름만으로 충분한 장소는 생략한다', example: '서울 마포구 양화로 45' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(255, { message: lengthValidationMessage })
  address?: string;

  @ApiPropertyOptional({ description: '상세 위치 메모 (최대 255자)', example: '지하 1층 B룸' })
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(255, { message: lengthValidationMessage })
  detailAddress?: string;

  @ApiPropertyOptional({ description: '위도. 지도 검색으로 고른 위치일 때만 address·longitude와 함께 보낸다', example: 37.5496 })
  @IsOptional()
  @IsNumber({}, { message: numberValidationMessage })
  @IsLatitude({ message: coordinateValidationMessage })
  latitude?: number;

  @ApiPropertyOptional({ description: '경도. latitude와 반드시 쌍으로 보낸다', example: 126.9139 })
  @IsOptional()
  @IsNumber({}, { message: numberValidationMessage })
  @IsLongitude({ message: coordinateValidationMessage })
  longitude?: number;

  @ApiPropertyOptional({ description: '커버 이미지 URL (최대 255자)', example: 'https://example.com/place.png' })
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(255, { message: lengthValidationMessage })
  imageUrl?: string;
}

export type CreatePlaceInput = CreatePlaceBodyDto;

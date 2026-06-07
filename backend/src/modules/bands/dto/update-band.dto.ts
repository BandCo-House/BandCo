import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { booleanValidationMessage } from 'src/common/validation-message/boolean-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

import { normalizeOptionalStringValue, trimStringValue } from '../../../common/validation/transform.util';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';

export class UpdateBandBodyDto {
  @ApiPropertyOptional({ description: '밴드 이름 (최대 40자)', example: '록밴드' })
  @Transform(trimStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(40, { message: lengthValidationMessage })
  name?: string;

  @ApiPropertyOptional({ description: '밴드 소개 (null로 설정 시 삭제)', nullable: true, example: '함께 음악을 만들어가는 밴드입니다.' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  description?: string | null;

  @ApiPropertyOptional({ description: '밴드 공개 여부', example: true })
  @IsOptional()
  @IsBoolean({ message: booleanValidationMessage })
  visibility?: boolean;

  @ApiPropertyOptional({ description: '밴드 커버 이미지 URL (null로 설정 시 삭제)', nullable: true, example: 'https://example.com/cover.jpg' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  coverImgUrl?: string | null;
}

export type UpdateBandInput = UpdateBandBodyDto;

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

import { normalizeOptionalStringValue, trimStringValue } from '../../../common/validation/transform.util';
import { enumValidationMessage } from '../../../common/validation-message/enum-validation.message';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { notemptyValidationMessage } from '../../../common/validation-message/notempty-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';

export class UpdateTeamBodyDto {
  @ApiPropertyOptional({ description: '팀 이름 (최대 150자)', example: '메인 보컬팀' })
  @Transform(trimStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  @MaxLength(150, { message: lengthValidationMessage })
  name?: string;

  @ApiPropertyOptional({ description: '팀 설명', example: '메인 보컬 중심 팀' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  description?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'], description: '팀 상태' })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'], { message: enumValidationMessage })
  status?: 'ACTIVE' | 'INACTIVE';

  @ApiPropertyOptional({ description: '팀 커버 이미지 URL', example: 'https://example.com/new-cover.png' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  teamCoverUrl?: string;
}

export type UpdateTeamInput = UpdateTeamBodyDto;

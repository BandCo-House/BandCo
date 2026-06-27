import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

import { normalizeOptionalStringValue, parseOptionalPositiveIntegerValue } from '../../../common/validation/transform.util';
import { enumValidationMessage } from '../../../common/validation-message/enum-validation.message';
import { intValidationMessage } from '../../../common/validation-message/int-validation.message';
import { minValidationMessage } from '../../../common/validation-message/min-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';
import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';

export class GetTeamMembersQueryDto {
  @ApiPropertyOptional({ description: '한 번에 가져올 항목 수', default: 20, minimum: 1 })
  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  take: number = 20;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc', description: 'joinedAt 정렬 방향' })
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: enumValidationMessage })
  order__joined_at: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc', description: 'id 정렬 방향' })
  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: enumValidationMessage })
  order__id: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ description: '커서 joinedAt (ISO 8601)', example: '2026-05-01T12:00:00.000Z' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  cursor__joined_at?: string;

  @ApiPropertyOptional({ description: '커서 ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsUUID(undefined, { message: uuidValidationMessage })
  cursor__id?: string;
}

export type GetTeamMembersQuery = GetTeamMembersQueryDto;

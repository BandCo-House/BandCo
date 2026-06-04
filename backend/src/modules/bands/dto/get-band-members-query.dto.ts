import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { normalizeOptionalStringValue, parseOptionalPositiveIntegerValue } from 'src/common/validation/transform.util';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { intValidationMessage } from 'src/common/validation-message/int-validation.message';
import { minValidationMessage } from 'src/common/validation-message/min-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';

const ORDER_DIRECTIONS = ['asc', 'desc'] as const;
export type BandMemberOrderDirection = (typeof ORDER_DIRECTIONS)[number];

export class GetBandMembersQueryDto {
  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: '가입일 정렬 방향', default: 'desc' })
  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__joined_at: BandMemberOrderDirection = 'desc';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: 'ID 정렬 방향', default: 'desc' })
  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__id: BandMemberOrderDirection = 'desc';

  @ApiPropertyOptional({ description: '한 번에 가져올 항목 수', default: 20, minimum: 1 })
  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  take: number = 20;

  @ApiPropertyOptional({ description: '커서 가입일 (ISO 8601)', example: '2024-01-01T00:00:00.000Z' })
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

export type GetBandMembersQuery = GetBandMembersQueryDto;

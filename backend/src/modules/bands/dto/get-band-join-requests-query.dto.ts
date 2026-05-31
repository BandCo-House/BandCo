import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { normalizeOptionalStringValue, parseOptionalPositiveIntegerValue } from 'src/common/validation/transform.util';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { intValidationMessage } from 'src/common/validation-message/int-validation.message';
import { minValidationMessage } from 'src/common/validation-message/min-validation.message';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';

import { JoinRequestStatus } from '../../../generated/prisma';

const ORDER_DIRECTIONS = ['asc', 'desc'] as const;
export type BandJoinRequestOrderDirection = (typeof ORDER_DIRECTIONS)[number];

export const BAND_JOIN_REQUEST_STATUSES = Object.values(JoinRequestStatus);
export type BandJoinRequestStatus = JoinRequestStatus;

export class GetBandJoinRequestsQueryDto {
  @ApiPropertyOptional({ enum: JoinRequestStatus, description: '가입 요청 상태 필터', default: 'PENDING' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsEnum(BAND_JOIN_REQUEST_STATUSES, { message: enumValidationMessage })
  where__join_request_status: BandJoinRequestStatus = JoinRequestStatus.PENDING;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: '생성일 정렬 방향', default: 'desc' })
  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__created_at: BandJoinRequestOrderDirection = 'desc';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: 'ID 정렬 방향', default: 'desc' })
  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__id: BandJoinRequestOrderDirection = 'desc';

  @ApiPropertyOptional({ description: '한 번에 가져올 항목 수', default: 20, minimum: 1 })
  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  take: number = 20;

  @ApiPropertyOptional({ description: '커서 ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsUUID(undefined, { message: uuidValidationMessage })
  cursor__id?: string;
}

export type GetBandJoinRequestsQuery = GetBandJoinRequestsQueryDto;

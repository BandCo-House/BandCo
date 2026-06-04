import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { normalizeOptionalStringValue, parseOptionalPositiveIntegerValue } from 'src/common/validation/transform.util';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { intValidationMessage } from 'src/common/validation-message/int-validation.message';
import { minValidationMessage } from 'src/common/validation-message/min-validation.message';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';

import { BandInvitationStatus } from '../../../generated/prisma';

const ORDER_DIRECTIONS = ['asc', 'desc'] as const;
export type ReceivedBandInvitationOrderDirection = (typeof ORDER_DIRECTIONS)[number];

export const RECEIVED_BAND_INVITATION_STATUSES = Object.values(BandInvitationStatus);
export type ReceivedBandInvitationStatus = BandInvitationStatus;

export class GetReceivedBandInvitationsQueryDto {
  @ApiPropertyOptional({ enum: BandInvitationStatus, description: '초대 상태 필터', default: 'PENDING' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsEnum(RECEIVED_BAND_INVITATION_STATUSES, { message: enumValidationMessage })
  where__invitation_status: ReceivedBandInvitationStatus = BandInvitationStatus.PENDING;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: '생성일 정렬 방향', default: 'desc' })
  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__created_at: ReceivedBandInvitationOrderDirection = 'desc';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], description: 'ID 정렬 방향', default: 'desc' })
  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__id: ReceivedBandInvitationOrderDirection = 'desc';

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

export type GetReceivedBandInvitationsQuery = GetReceivedBandInvitationsQueryDto;

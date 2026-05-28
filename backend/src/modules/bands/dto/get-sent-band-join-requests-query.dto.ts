import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { normalizeOptionalStringValue, parseOptionalPositiveIntegerValue } from 'src/common/validation/transform.util';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { intValidationMessage } from 'src/common/validation-message/int-validation.message';
import { minValidationMessage } from 'src/common/validation-message/min-validation.message';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';

import { JoinRequestStatus } from '../../../generated/prisma';

const ORDER_DIRECTIONS = ['asc', 'desc'] as const;
export type SentBandJoinRequestOrderDirection = (typeof ORDER_DIRECTIONS)[number];

export const SENT_BAND_JOIN_REQUEST_STATUSES = Object.values(JoinRequestStatus);
export type SentBandJoinRequestStatus = JoinRequestStatus;

export class GetSentBandJoinRequestsQueryDto {
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsEnum(SENT_BAND_JOIN_REQUEST_STATUSES, { message: enumValidationMessage })
  where__join_request_status: SentBandJoinRequestStatus = JoinRequestStatus.PENDING;

  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__created_at: SentBandJoinRequestOrderDirection = 'desc';

  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__id: SentBandJoinRequestOrderDirection = 'desc';

  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  take: number = 20;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsUUID(undefined, { message: uuidValidationMessage })
  cursor__id?: string;
}

export type GetSentBandJoinRequestsQuery = GetSentBandJoinRequestsQueryDto;

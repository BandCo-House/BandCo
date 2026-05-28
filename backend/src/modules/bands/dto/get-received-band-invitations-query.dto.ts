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
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsEnum(RECEIVED_BAND_INVITATION_STATUSES, { message: enumValidationMessage })
  where__invitation_status: ReceivedBandInvitationStatus = BandInvitationStatus.PENDING;

  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__created_at: ReceivedBandInvitationOrderDirection = 'desc';

  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__id: ReceivedBandInvitationOrderDirection = 'desc';

  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  take: number = 20;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsUUID(undefined, { message: uuidValidationMessage })
  cursor__id?: string;
}

export type GetReceivedBandInvitationsQuery = GetReceivedBandInvitationsQueryDto;

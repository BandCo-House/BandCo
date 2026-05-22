import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { booleanValidationMessage } from 'src/common/validation-message/boolean-validation.message';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { intValidationMessage } from 'src/common/validation-message/int-validation.message';
import { minValidationMessage } from 'src/common/validation-message/min-validation.message';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';

import {
  normalizeOptionalStringValue,
  parseOptionalBooleanValue,
  parseOptionalPositiveIntegerValue,
} from '../../../common/validation/transform.util';
import { NotificationType } from '../../../generated/prisma';

const ORDER_DIRECTIONS = ['asc', 'desc'] as const;
type OrderDirection = (typeof ORDER_DIRECTIONS)[number];

export const NOTIFICATION_LIST_TYPES = Object.values(NotificationType);
export type NotificationListType = NotificationType;

export class GetNotificationsQueryDto {
  @Transform(parseOptionalBooleanValue)
  @IsOptional()
  @IsBoolean({ message: booleanValidationMessage })
  where__is_read?: boolean;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsEnum(NOTIFICATION_LIST_TYPES, { message: enumValidationMessage })
  where__type?: NotificationListType;

  @Transform(normalizeOptionalStringValue)
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__created_at: OrderDirection = 'desc';

  @Transform(normalizeOptionalStringValue)
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__id: OrderDirection = 'desc';

  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  take: number = 20;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsUUID(undefined, { message: uuidValidationMessage })
  cursor__id?: string;
}

export type GetNotificationsQuery = GetNotificationsQueryDto;

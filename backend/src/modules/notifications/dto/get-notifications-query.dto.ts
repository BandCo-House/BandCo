import { Transform } from 'class-transformer';
import { IsBoolean, IsDate, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

import {
  normalizeOptionalStringValue,
  parseOptionalBooleanValue,
  parseOptionalDateValue,
  parseOptionalPositiveIntegerValue,
} from '../../../common/validation/transform.util';
import { NotificationType } from '../../../generated/prisma';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { intValidationMessage } from 'src/common/validation-message/int-validation.message';
import { booleanValidationMessage } from 'src/common/validation-message/boolean-validation.message';
import { dateValidationMessage } from 'src/common/validation-message/date-validation.message';
import { minValidationMessage } from 'src/common/validation-message/min-validation.message';
import { isInValidationMessage } from 'src/common/validation-message/isin-validation.message';

export type NotificationListType = NotificationType;

export const NOTIFICATION_LIST_TYPES = Object.values(NotificationType);

export class GetNotificationsQueryDto {
  @Transform(parseOptionalBooleanValue)
  @IsOptional()
  @IsBoolean({
    message: booleanValidationMessage,
  })
  isRead?: boolean;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: stringValidationMessage,
  })
  @IsIn(NOTIFICATION_LIST_TYPES, {
    message: isInValidationMessage,
  })
  type?: NotificationListType;

  @Transform(parseOptionalDateValue)
  @IsOptional()
  @IsDate({
    message: dateValidationMessage,
  })
  from?: Date;

  @Transform(parseOptionalDateValue)
  @IsOptional()
  @IsDate({
    message: dateValidationMessage,
  })
  to?: Date;

  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({
    message: intValidationMessage,
  })
  @Min(1, {
    message: minValidationMessage,
  })
  page: number = 1;

  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({
    message: intValidationMessage,
  })
  @Min(1, {
    message: minValidationMessage,
  })
  size: number = 20;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: stringValidationMessage,
  })
  sort?: string;
}

export type GetNotificationsQuery = GetNotificationsQueryDto;

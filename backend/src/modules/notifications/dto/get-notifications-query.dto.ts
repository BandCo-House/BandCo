import { Transform } from 'class-transformer';
import { IsBoolean, IsDate, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

import {
  normalizeOptionalStringValue,
  parseOptionalBooleanValue,
  parseOptionalDateValue,
  parseOptionalPositiveIntegerValue,
} from '../../../common/validation/transform.util';
import { NotificationType } from '../../../generated/prisma';

export type NotificationListType = NotificationType;

export const NOTIFICATION_LIST_TYPES = Object.values(NotificationType);

export class GetNotificationsQueryDto {
  @Transform(parseOptionalBooleanValue)
  @IsOptional()
  @IsBoolean({
    message: 'isRead는 true 또는 false 여야 합니다.',
  })
  isRead?: boolean;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: 'type은 문자열이어야 합니다.',
  })
  @IsIn(NOTIFICATION_LIST_TYPES, {
    message: 'type은 INVITE, NOTICE, REMINDER 중 하나여야 합니다.',
  })
  type?: NotificationListType;

  @Transform(parseOptionalDateValue)
  @IsOptional()
  @IsDate({
    message: 'from은 ISO-8601 형식의 날짜여야 합니다.',
  })
  from?: Date;

  @Transform(parseOptionalDateValue)
  @IsOptional()
  @IsDate({
    message: 'to은 ISO-8601 형식의 날짜여야 합니다.',
  })
  to?: Date;

  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({
    message: 'page는 1 이상의 정수여야 합니다.',
  })
  @Min(1, {
    message: 'page는 1 이상의 정수여야 합니다.',
  })
  page: number = 1;

  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({
    message: 'size는 1 이상의 정수여야 합니다.',
  })
  @Min(1, {
    message: 'size는 1 이상의 정수여야 합니다.',
  })
  size: number = 20;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({
    message: 'sort는 문자열이어야 합니다.',
  })
  sort?: string;
}

export type GetNotificationsQuery = GetNotificationsQueryDto;

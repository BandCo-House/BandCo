import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { normalizeOptionalStringValue } from 'src/common/validation/transform.util';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { maxValidationMessage } from 'src/common/validation-message/max-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

import { AdminPaginationQueryDto } from '../../core/dto/admin-pagination-query.dto';
import { ADMIN_USER_STATUS_FILTERS, type AdminUserStatusFilter } from '../types/admin-user.type';

/** 운영 사유 최대 길이. 감사 로그 detail에 그대로 남는다. */
const ADMIN_REASON_MAX_LENGTH = 500;

const UPDATABLE_USER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export class GetAdminUsersQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ description: '이메일·닉네임 부분일치, UUID면 회원 ID 일치' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(100, { message: maxValidationMessage })
  keyword?: string;

  @ApiPropertyOptional({ enum: ADMIN_USER_STATUS_FILTERS, description: '회원 상태 필터. 없으면 전체' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsIn(ADMIN_USER_STATUS_FILTERS, { message: enumValidationMessage })
  status?: AdminUserStatusFilter;
}

export class UpdateAdminUserStatusDto {
  @ApiProperty({ enum: UPDATABLE_USER_STATUSES, description: '바꿀 상태' })
  @IsIn(UPDATABLE_USER_STATUSES, { message: enumValidationMessage })
  status: (typeof UPDATABLE_USER_STATUSES)[number];

  @ApiPropertyOptional({ description: '변경 사유(최대 500자)' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(ADMIN_REASON_MAX_LENGTH, { message: maxValidationMessage })
  reason?: string;
}

export class WithdrawAdminUserDto {
  @ApiPropertyOptional({ description: '탈퇴 처리 사유(최대 500자)' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(ADMIN_REASON_MAX_LENGTH, { message: maxValidationMessage })
  reason?: string;
}

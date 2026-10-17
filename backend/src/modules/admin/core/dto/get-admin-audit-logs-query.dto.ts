import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { normalizeOptionalStringValue } from 'src/common/validation/transform.util';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { maxValidationMessage } from 'src/common/validation-message/max-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';

import { ADMIN_AUDIT_ACTIONS, ADMIN_AUDIT_TARGET_TYPES, type AdminAuditAction, type AdminAuditTargetType } from '../types/admin-audit.type';

import { AdminPaginationQueryDto } from './admin-pagination-query.dto';

export class GetAdminAuditLogsQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ description: '작업한 어드민 ID' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsUUID(undefined, { message: uuidValidationMessage })
  adminId?: string;

  @ApiPropertyOptional({ enum: ADMIN_AUDIT_ACTIONS, description: '작업 종류' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsIn(ADMIN_AUDIT_ACTIONS, { message: enumValidationMessage })
  action?: AdminAuditAction;

  @ApiPropertyOptional({ enum: ADMIN_AUDIT_TARGET_TYPES, description: '대상 종류' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsIn(ADMIN_AUDIT_TARGET_TYPES, { message: enumValidationMessage })
  targetType?: AdminAuditTargetType;

  @ApiPropertyOptional({ description: '대상 ID' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(64, { message: maxValidationMessage })
  targetId?: string;
}

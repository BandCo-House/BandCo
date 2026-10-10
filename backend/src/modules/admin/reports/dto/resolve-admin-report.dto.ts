import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { normalizeOptionalStringValue } from 'src/common/validation/transform.util';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

import { ADMIN_REPORT_RESOLUTION_STATUSES, type AdminReportResolutionStatus } from '../types/admin-report.type';

export class ResolveAdminReportDto {
  @ApiProperty({ enum: ADMIN_REPORT_RESOLUTION_STATUSES, description: '처리 결과' })
  @IsIn(ADMIN_REPORT_RESOLUTION_STATUSES, { message: enumValidationMessage })
  status: AdminReportResolutionStatus;

  @ApiPropertyOptional({ description: '처리 메모(1~1000자)', example: '스팸 메시지 확인, 경고 조치' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @Length(1, 1000, { message: lengthValidationMessage })
  resolutionNote?: string;
}

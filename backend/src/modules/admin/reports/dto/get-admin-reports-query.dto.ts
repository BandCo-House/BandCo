import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { normalizeOptionalStringValue } from 'src/common/validation/transform.util';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { UserReportStatus } from 'src/generated/prisma';

import { AdminPaginationQueryDto } from '../../core/dto/admin-pagination-query.dto';

export class GetAdminReportsQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ enum: UserReportStatus, description: '처리 상태. 없으면 전체' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsIn(Object.values(UserReportStatus), { message: enumValidationMessage })
  status?: UserReportStatus;
}

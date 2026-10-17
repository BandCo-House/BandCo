import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { parseOptionalPositiveIntegerValue } from 'src/common/validation/transform.util';
import { intValidationMessage } from 'src/common/validation-message/int-validation.message';
import { maxValidationMessage } from 'src/common/validation-message/max-validation.message';
import { minValidationMessage } from 'src/common/validation-message/min-validation.message';

export class GetAdminDashboardSignupsQueryDto {
  @ApiPropertyOptional({ description: '오늘(KST)을 포함한 조회 일수', default: 30, minimum: 1, maximum: 180 })
  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  @Max(180, { message: maxValidationMessage })
  days: number = 30;
}

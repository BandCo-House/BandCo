import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { parseOptionalPositiveIntegerValue } from 'src/common/validation/transform.util';
import { intValidationMessage } from 'src/common/validation-message/int-validation.message';
import { maxValidationMessage } from 'src/common/validation-message/max-validation.message';
import { minValidationMessage } from 'src/common/validation-message/min-validation.message';

/** 어드민 목록 API 공통 오프셋 페이지네이션 쿼리 */
export class AdminPaginationQueryDto {
  @ApiPropertyOptional({ description: '페이지 번호(1부터)', default: 1, minimum: 1 })
  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  page: number = 1;

  @ApiPropertyOptional({ description: '페이지 크기', default: 20, minimum: 1, maximum: 100 })
  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  @Max(100, { message: maxValidationMessage })
  size: number = 20;
}

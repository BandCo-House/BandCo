import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { normalizeOptionalStringValue, parseOptionalBooleanValue } from 'src/common/validation/transform.util';
import { booleanValidationMessage } from 'src/common/validation-message/boolean-validation.message';
import { maxValidationMessage } from 'src/common/validation-message/max-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

import { AdminPaginationQueryDto } from '../../core/dto/admin-pagination-query.dto';

export class GetAdminBandsQueryDto extends AdminPaginationQueryDto {
  @ApiPropertyOptional({ description: '밴드명 부분일치(대소문자 무시) 또는 밴드 ID(UUID) 일치', example: '락밴드' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(100, { message: maxValidationMessage })
  keyword?: string;

  @ApiPropertyOptional({ description: '삭제된 밴드 포함 여부', default: false })
  @Transform(parseOptionalBooleanValue)
  @IsBoolean({ message: booleanValidationMessage })
  includeDeleted: boolean = false;
}

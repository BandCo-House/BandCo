import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { normalizeOptionalStringValue, parseOptionalPositiveIntegerValue } from 'src/common/validation/transform.util';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { intValidationMessage } from 'src/common/validation-message/int-validation.message';
import { minValidationMessage } from 'src/common/validation-message/min-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';

const ORDER_DIRECTIONS = ['asc', 'desc'] as const;
type OrderDirection = (typeof ORDER_DIRECTIONS)[number];

export class GetUsersQueryDto {
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  where__nickname__contain?: string;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  where__email__contain?: string;

  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__created_at: OrderDirection = 'desc';

  @IsOptional()
  @IsEnum(ORDER_DIRECTIONS, { message: enumValidationMessage })
  order__id: OrderDirection = 'desc';

  @Transform(parseOptionalPositiveIntegerValue)
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  take: number = 20;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  cursor__created_at?: string;

  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsUUID(undefined, { message: uuidValidationMessage })
  cursor__id?: string;
}

export type GetUsersQuery = GetUsersQueryDto;

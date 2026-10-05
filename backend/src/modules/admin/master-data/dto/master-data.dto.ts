import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min, ValidateIf } from 'class-validator';
import { trimStringValue } from 'src/common/validation/transform.util';
import { intValidationMessage } from 'src/common/validation-message/int-validation.message';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { maxValidationMessage } from 'src/common/validation-message/max-validation.message';
import { minValidationMessage } from 'src/common/validation-message/min-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

/** genres·skill_types.name 컬럼 길이(VarChar(40)) */
const MASTER_DATA_NAME_MAX_LENGTH = 40;

/** sort_order 컬럼(PostgreSQL integer)의 최대값. 넘으면 DB 오류(500)가 나므로 요청 단계에서 막는다. */
const SORT_ORDER_MAX = 2147483647;

/** 장르·세션 생성 요청 */
export class CreateMasterDataDto {
  @ApiProperty({ description: '이름(앞뒤 공백 제거 후 1~40자)', example: '록 (Rock)' })
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @Length(1, MASTER_DATA_NAME_MAX_LENGTH, { message: lengthValidationMessage })
  name: string;

  @ApiPropertyOptional({ description: '표시 순서(0 이상, 작을수록 앞). 생략하면 현재 최대값 + 1(없으면 0)', minimum: 0, example: 10 })
  @IsOptional()
  @IsInt({ message: intValidationMessage })
  @Min(0, { message: minValidationMessage })
  @Max(SORT_ORDER_MAX, { message: maxValidationMessage })
  sortOrder?: number;
}

/** 장르·세션 수정 요청. 보낸 필드만 바꾼다. null은 허용하지 않는다. */
export class UpdateMasterDataDto {
  @ApiPropertyOptional({ description: '이름(앞뒤 공백 제거 후 1~40자)', example: '록 (Rock)' })
  @ValidateIf((dto: UpdateMasterDataDto) => dto.name !== undefined)
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @Length(1, MASTER_DATA_NAME_MAX_LENGTH, { message: lengthValidationMessage })
  name?: string;

  @ApiPropertyOptional({ description: '표시 순서(0 이상, 작을수록 앞)', minimum: 0, example: 10 })
  @ValidateIf((dto: UpdateMasterDataDto) => dto.sortOrder !== undefined)
  @IsInt({ message: intValidationMessage })
  @Min(0, { message: minValidationMessage })
  @Max(SORT_ORDER_MAX, { message: maxValidationMessage })
  sortOrder?: number;
}

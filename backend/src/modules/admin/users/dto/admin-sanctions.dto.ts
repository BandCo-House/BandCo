import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsISO8601, IsOptional, IsString, Length } from 'class-validator';
import { normalizeOptionalStringValue, trimStringValue } from 'src/common/validation/transform.util';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { iso8601ValidationMessage } from 'src/common/validation-message/iso8601-validation.message';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { UserSanctionType } from 'src/generated/prisma';

export class CreateAdminSanctionDto {
  @ApiProperty({ enum: UserSanctionType, description: '제재 종류' })
  @IsIn(Object.values(UserSanctionType), { message: enumValidationMessage })
  type: UserSanctionType;

  @ApiProperty({ description: '제재 사유(1~500자). 경고는 회원 알림 내용으로도 쓰인다.' })
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @Length(1, 500, { message: lengthValidationMessage })
  reason: string;

  @ApiPropertyOptional({ description: '정지 종료 시각(현재 이후). SUSPENSION에서만 쓰며 없으면 영구 정지', example: '2026-12-31T23:59:59+09:00' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  endsAt?: string;
}

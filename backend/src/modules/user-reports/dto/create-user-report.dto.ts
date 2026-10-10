import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { normalizeOptionalStringValue } from 'src/common/validation/transform.util';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { UserReportReason } from 'src/generated/prisma';

export const USER_REPORT_DESCRIPTION_MAX_LENGTH = 1000;

export class CreateUserReportDto {
  @ApiProperty({ enum: UserReportReason, description: '신고 사유' })
  @IsIn(Object.values(UserReportReason), { message: enumValidationMessage })
  reason: UserReportReason;

  @ApiPropertyOptional({ description: '상세 설명(1~1000자)', example: '채팅으로 광고 링크를 계속 보냅니다.' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @Length(1, USER_REPORT_DESCRIPTION_MAX_LENGTH, { message: lengthValidationMessage })
  description?: string;
}

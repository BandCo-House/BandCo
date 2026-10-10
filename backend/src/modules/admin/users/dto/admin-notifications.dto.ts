import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';
import { normalizeOptionalStringValue, trimStringValue } from 'src/common/validation/transform.util';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

/** 관리자 공지 알림 본문. 개별 발송과 전체 발송이 같은 형식을 쓴다. */
export class SendAdminNoticeDto {
  @ApiProperty({ description: '알림 제목(1~120자)', example: '서비스 점검 안내' })
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @Length(1, 120, { message: lengthValidationMessage })
  title: string;

  @ApiPropertyOptional({ description: '알림 내용' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  description?: string;

  @ApiPropertyOptional({ description: '알림을 눌렀을 때 이동할 앱 경로', example: '/notices' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  targetPath?: string;
}

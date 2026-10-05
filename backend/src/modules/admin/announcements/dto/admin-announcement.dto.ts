import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsISO8601, IsOptional, IsString, Length, ValidateIf } from 'class-validator';
import { trimStringValue } from 'src/common/validation/transform.util';
import { booleanValidationMessage } from 'src/common/validation-message/boolean-validation.message';
import { iso8601ValidationMessage } from 'src/common/validation-message/iso8601-validation.message';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

export const ANNOUNCEMENT_TITLE_MAX_LENGTH = 120;
export const ANNOUNCEMENT_CONTENT_MAX_LENGTH = 5000;

/** null을 허용하지 않는 수정 필드는 값이 들어왔을 때만 검증한다. IsOptional은 null도 통과시키기 때문이다. */
const isProvided = (_object: object, value: unknown): boolean => value !== undefined;

export class CreateAdminAnnouncementDto {
  @ApiProperty({ description: '제목(1~120자)', example: '10월 정기 점검 안내' })
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @Length(1, ANNOUNCEMENT_TITLE_MAX_LENGTH, { message: lengthValidationMessage })
  title: string;

  @ApiProperty({ description: '본문(1~5000자)', example: '10월 10일 02:00~04:00 서비스 점검이 진행됩니다.' })
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @Length(1, ANNOUNCEMENT_CONTENT_MAX_LENGTH, { message: lengthValidationMessage })
  content: string;

  @ApiProperty({ description: '게시 여부' })
  @IsBoolean({ message: booleanValidationMessage })
  isPublished: boolean;

  @ApiPropertyOptional({ description: '게시 시작 시각(ISO 8601). 없으면 즉시', example: '2026-10-05T00:00:00.000Z', nullable: true })
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  startsAt?: string | null;

  @ApiPropertyOptional({ description: '게시 종료 시각(ISO 8601). 없으면 무기한', example: '2026-10-11T00:00:00.000Z', nullable: true })
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  endsAt?: string | null;
}

export class UpdateAdminAnnouncementDto {
  @ApiPropertyOptional({ description: '제목(1~120자)' })
  @ValidateIf(isProvided)
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @Length(1, ANNOUNCEMENT_TITLE_MAX_LENGTH, { message: lengthValidationMessage })
  title?: string;

  @ApiPropertyOptional({ description: '본문(1~5000자)' })
  @ValidateIf(isProvided)
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @Length(1, ANNOUNCEMENT_CONTENT_MAX_LENGTH, { message: lengthValidationMessage })
  content?: string;

  @ApiPropertyOptional({ description: '게시 여부' })
  @ValidateIf(isProvided)
  @IsBoolean({ message: booleanValidationMessage })
  isPublished?: boolean;

  @ApiPropertyOptional({ description: '게시 시작 시각(ISO 8601). null이면 제한 해제', nullable: true })
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  startsAt?: string | null;

  @ApiPropertyOptional({ description: '게시 종료 시각(ISO 8601). null이면 제한 해제', nullable: true })
  @IsOptional()
  @IsISO8601({ strict: true, strictSeparator: true }, { message: iso8601ValidationMessage })
  endsAt?: string | null;
}

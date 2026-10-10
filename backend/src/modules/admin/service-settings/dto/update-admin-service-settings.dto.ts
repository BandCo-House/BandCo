import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Length, Matches, MaxLength, ValidateIf } from 'class-validator';
import { trimStringValue } from 'src/common/validation/transform.util';
import { booleanValidationMessage } from 'src/common/validation-message/boolean-validation.message';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { matchValidationMessage } from 'src/common/validation-message/match-validation.message';
import { maxValidationMessage } from 'src/common/validation-message/max-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

export const MAINTENANCE_MESSAGE_MAX_LENGTH = 500;
/** min_app_version 컬럼이 VARCHAR(20)이다. */
export const MIN_APP_VERSION_MAX_LENGTH = 20;
export const APP_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

export class UpdateAdminServiceSettingsDto {
  @ApiPropertyOptional({ description: '점검 모드 여부' })
  // null을 허용하지 않으므로 IsOptional(null 통과) 대신 값이 들어왔을 때만 검증한다.
  @ValidateIf((_object: object, value: unknown) => value !== undefined)
  @IsBoolean({ message: booleanValidationMessage })
  maintenanceEnabled?: boolean;

  @ApiPropertyOptional({ description: '점검 안내 문구(1~500자). null이면 기본 문구', nullable: true, example: '10시까지 서버 점검 중입니다.' })
  @IsOptional()
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @Length(1, MAINTENANCE_MESSAGE_MAX_LENGTH, { message: lengthValidationMessage })
  maintenanceMessage?: string | null;

  @ApiPropertyOptional({ description: '최소 앱 버전(x.y.z). null이면 제한 없음', nullable: true, example: '1.4.0' })
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @MaxLength(MIN_APP_VERSION_MAX_LENGTH, { message: maxValidationMessage })
  @Matches(APP_VERSION_PATTERN, { message: matchValidationMessage })
  minAppVersion?: string | null;
}

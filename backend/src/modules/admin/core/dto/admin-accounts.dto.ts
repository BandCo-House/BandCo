import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, Length } from 'class-validator';
import { trimStringValue } from 'src/common/validation/transform.util';
import { booleanValidationMessage } from 'src/common/validation-message/boolean-validation.message';
import { emailValidationMessage } from 'src/common/validation-message/email-validation.message';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { AdminRole } from 'src/generated/prisma';

import { ADMIN_PASSWORD_MAX_LENGTH, ADMIN_PASSWORD_MIN_LENGTH } from './admin-auth.dto';

export class CreateAdminDto {
  @ApiProperty({ description: '어드민 이메일', example: 'operator@bandco.kr' })
  @IsEmail({}, { message: emailValidationMessage })
  email: string;

  @ApiProperty({ description: '표시 이름(1~50자)', example: '운영자1' })
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @Length(1, 50, { message: lengthValidationMessage })
  name: string;

  @ApiProperty({ description: '초기 비밀번호(8~72자)' })
  @IsString({ message: stringValidationMessage })
  @Length(ADMIN_PASSWORD_MIN_LENGTH, ADMIN_PASSWORD_MAX_LENGTH, { message: lengthValidationMessage })
  password: string;

  @ApiProperty({ enum: AdminRole, description: '역할' })
  @IsIn(Object.values(AdminRole), { message: enumValidationMessage })
  role: AdminRole;
}

export class UpdateAdminDto {
  @ApiPropertyOptional({ description: '표시 이름(1~50자)' })
  @IsOptional()
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @Length(1, 50, { message: lengthValidationMessage })
  name?: string;

  @ApiPropertyOptional({ enum: AdminRole, description: '역할' })
  @IsOptional()
  @IsIn(Object.values(AdminRole), { message: enumValidationMessage })
  role?: AdminRole;

  @ApiPropertyOptional({ description: '활성 여부' })
  @IsOptional()
  @IsBoolean({ message: booleanValidationMessage })
  isActive?: boolean;
}

export class ResetAdminPasswordDto {
  @ApiProperty({ description: '새 비밀번호(8~72자)' })
  @IsString({ message: stringValidationMessage })
  @Length(ADMIN_PASSWORD_MIN_LENGTH, ADMIN_PASSWORD_MAX_LENGTH, { message: lengthValidationMessage })
  newPassword: string;
}

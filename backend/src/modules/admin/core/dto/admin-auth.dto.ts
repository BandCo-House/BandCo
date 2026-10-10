import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';
import { emailValidationMessage } from 'src/common/validation-message/email-validation.message';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

/** bcrypt는 72바이트 이후를 무시하므로 상한을 72로 둔다 */
export const ADMIN_PASSWORD_MIN_LENGTH = 8;
export const ADMIN_PASSWORD_MAX_LENGTH = 72;

export class AdminLoginDto {
  @ApiProperty({ description: '어드민 이메일', example: 'admin@bandco.kr' })
  @IsEmail({}, { message: emailValidationMessage })
  email: string;

  @ApiProperty({ description: '비밀번호', example: 'password1234' })
  @IsString({ message: stringValidationMessage })
  @Length(1, ADMIN_PASSWORD_MAX_LENGTH, { message: lengthValidationMessage })
  password: string;
}

export class ChangeAdminPasswordDto {
  @ApiProperty({ description: '현재 비밀번호' })
  @IsString({ message: stringValidationMessage })
  @Length(1, ADMIN_PASSWORD_MAX_LENGTH, { message: lengthValidationMessage })
  currentPassword: string;

  @ApiProperty({ description: '새 비밀번호(8~72자)', minLength: ADMIN_PASSWORD_MIN_LENGTH, maxLength: ADMIN_PASSWORD_MAX_LENGTH })
  @IsString({ message: stringValidationMessage })
  @Length(ADMIN_PASSWORD_MIN_LENGTH, ADMIN_PASSWORD_MAX_LENGTH, { message: lengthValidationMessage })
  newPassword: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';
import { emailValidationMessage } from 'src/common/validation-message/email-validation.message';
import { lengthValidationMessage } from 'src/common/validation-message/length-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

export class RegisterEmailDto {
  @ApiProperty({ description: '이메일 주소', example: 'user@example.com' })
  @IsEmail({}, { message: emailValidationMessage })
  email: string;

  @ApiProperty({ description: '비밀번호 (최소 8자, 알파벳·숫자·특수문자(!@#$%^&*()) 조합, 특수문자 1개 이상)', example: 'Password123!' })
  @IsString({ message: stringValidationMessage })
  @MinLength(8, { message: lengthValidationMessage })
  @Matches(/^[a-zA-Z0-9!@#$%^&*()]+$/, {
    message: '비밀번호는 알파벳, 숫자, !@#$%^&*() 만 사용 가능합니다.',
  })
  @Matches(/[!@#$%^&*()]/, {
    message: '비밀번호는 특수문자(!@#$%^&*())를 1개 이상 포함해야 합니다.',
  })
  password: string;
}

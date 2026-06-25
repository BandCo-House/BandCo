import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { emailValidationMessage } from 'src/common/validation-message/email-validation.message';

export class CheckEmailDto {
  @ApiProperty({ description: '이메일 주소', example: 'user@example.com' })
  @IsEmail({}, { message: emailValidationMessage })
  email!: string;
}

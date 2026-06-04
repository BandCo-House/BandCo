import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches } from 'class-validator';

export class RegisterEmailDto {
  @ApiProperty({ description: '이메일 주소', example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '비밀번호 (알파벳, 숫자, !@#$%^&*() 조합)', example: 'Password123!' })
  @IsString()
  @Matches(/^[a-zA-Z0-9!@#$%^&*()]+$/, {
    message: '비밀번호는 알파벳, 숫자, !@#$%^&*() 만 사용 가능합니다.',
  })
  password: string;
}

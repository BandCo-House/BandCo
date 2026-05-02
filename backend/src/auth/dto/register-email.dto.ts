import { IsEmail, IsString, Matches } from 'class-validator';

export class RegisterEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9!@#$%^&*()]+$/, {
    message: '비밀번호는 알파벳, 숫자, !@#$%^&*() 만 사용 가능합니다.',
  })
  password: string;
}

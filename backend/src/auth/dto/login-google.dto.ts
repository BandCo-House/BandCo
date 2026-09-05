import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

export class LoginGoogleDto {
  @ApiProperty({ description: 'Google Identity Services에서 받은 ID 토큰', example: 'eyJhbGciOi...' })
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty()
  idToken!: string;
}

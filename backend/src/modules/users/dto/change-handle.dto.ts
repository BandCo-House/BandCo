import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

import { HANDLE_PATTERN, HANDLE_PATTERN_MESSAGE } from '../constants/user-profile.constant';

export class ChangeHandleDto {
  @ApiProperty({ description: '고유 ID (영문 대소문자·숫자·_ 4~8자)', example: 'devjun' })
  @IsString({ message: stringValidationMessage })
  @Matches(HANDLE_PATTERN, { message: HANDLE_PATTERN_MESSAGE })
  handle!: string;
}

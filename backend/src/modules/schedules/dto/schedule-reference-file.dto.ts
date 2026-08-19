import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { notemptyValidationMessage } from '../../../common/validation-message/notempty-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';

/**
 * 일정 참고자료 파일 항목. fileUrl은 storage 모듈 업로드 후 반환된 objectUrl이다.
 */
export class ScheduleReferenceFileDto {
  @ApiProperty({ description: '파일 URL (storage 업로드 후 objectUrl)', example: 'https://.../schedule-references/uuid.pdf' })
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  fileUrl!: string;

  @ApiProperty({ description: '원본 파일명 (최대 255자)', example: '합주_공지.pdf' })
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  @MaxLength(255, { message: lengthValidationMessage })
  fileName!: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { notemptyValidationMessage } from '../../common/validation-message/notempty-validation.message';
import { stringValidationMessage } from '../../common/validation-message/string-validation.message';

/**
 * Presigned URL 발급 요청 본문을 검증한다.
 */
export class GetPresignedUrlDto {
  @ApiProperty({ description: '업로드 폴더 경로', example: 'profiles' })
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  folder!: string;

  @ApiProperty({ description: '파일 MIME 타입', example: 'image/jpeg' })
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  contentType!: string;
}

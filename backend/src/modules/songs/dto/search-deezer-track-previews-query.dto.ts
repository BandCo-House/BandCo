import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

import { trimStringValue } from '../../../common/validation/transform.util';
import { notemptyValidationMessage } from '../../../common/validation-message/notempty-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';

/**
 * Deezer 검색어는 외부 API 호출 전에 빈 문자열을 차단한다.
 */
export class SearchDeezerTrackPreviewsQueryDto {
  @ApiProperty({ description: 'Deezer 곡 검색어', example: 'Bohemian Rhapsody Queen' })
  @Transform(trimStringValue)
  @IsString({
    message: stringValidationMessage,
  })
  @IsNotEmpty({
    message: notemptyValidationMessage,
  })
  query!: string;
}

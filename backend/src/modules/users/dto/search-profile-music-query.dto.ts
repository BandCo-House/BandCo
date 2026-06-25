import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { notemptyValidationMessage } from 'src/common/validation-message/notempty-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

export class SearchProfileMusicQueryDto {
  @ApiProperty({ description: '검색어 (곡명, 아티스트명)', example: 'Blinding Lights' })
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  q!: string;
}

import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import { trimStringValue } from 'src/common/validation/transform.util';
import { notemptyValidationMessage } from 'src/common/validation-message/notempty-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

export class SearchProfileMusicQueryDto {
  @Transform(trimStringValue)
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty({ message: notemptyValidationMessage })
  q!: string;
}

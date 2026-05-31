import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

export class ProfileMusicDto {
  @IsString({ message: stringValidationMessage })
  @IsNotEmpty()
  externalTrackId!: string;

  @IsEnum(['DEEZER'])
  sourceType!: 'DEEZER';

  @IsString({ message: stringValidationMessage })
  @IsNotEmpty()
  title!: string;

  @IsString({ message: stringValidationMessage })
  @IsNotEmpty()
  artistName!: string;

  @IsString({ message: stringValidationMessage })
  @IsNotEmpty()
  albumName!: string;

  @IsOptional()
  @IsUrl()
  albumImageUrl?: string | null;

  @IsInt()
  @Min(0)
  durationMs!: number;

  @IsOptional()
  @IsUrl()
  previewUrl?: string | null;

  @IsUrl()
  sourceUrl!: string;
}

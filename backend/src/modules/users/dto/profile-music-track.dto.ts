import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';

import type { ProfileMusicTrack } from '../types/profile-music.type';

export class ProfileMusicTrackDto implements ProfileMusicTrack {
  @ApiProperty({ description: '외부 트랙 ID', example: '12345' })
  @IsString({ message: stringValidationMessage })
  externalTrackId!: string;

  @ApiProperty({ description: '소스 타입', example: 'DEEZER' })
  @IsIn(['DEEZER'])
  sourceType!: 'DEEZER';

  @ApiProperty({ description: '곡 제목', example: 'Blinding Lights' })
  @IsString({ message: stringValidationMessage })
  title!: string;

  @ApiProperty({ description: '아티스트명', example: 'The Weeknd' })
  @IsString({ message: stringValidationMessage })
  artistName!: string;

  @ApiProperty({ description: '앨범명', example: 'After Hours' })
  @IsString({ message: stringValidationMessage })
  albumName!: string;

  @ApiPropertyOptional({ description: '앨범 이미지 URL', example: 'https://example.com/album.jpg', nullable: true })
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  albumImageUrl!: string | null;

  @ApiProperty({ description: '재생 시간 (밀리초)', example: 200000 })
  @IsInt()
  durationMs!: number;

  @ApiPropertyOptional({ description: '미리 듣기 URL', example: 'https://cdns-preview.dzcdn.net/...', nullable: true })
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  previewUrl!: string | null;

  @ApiProperty({ description: '소스 URL', example: 'https://www.deezer.com/track/12345' })
  @IsString({ message: stringValidationMessage })
  sourceUrl!: string;
}

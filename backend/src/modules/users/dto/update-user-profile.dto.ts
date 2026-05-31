import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';
import { SkillLevelType } from 'src/generated/prisma';

class UpdateProfileDto {
  @ApiPropertyOptional({ description: '닉네임', example: '홍길동' })
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  nickname?: string;

  @ApiPropertyOptional({ description: '자기 소개', example: '기타를 사랑하는 밴드맨입니다.' })
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  selfDescription?: string;

  @ApiPropertyOptional({ description: '프로필 음악 URL', example: 'https://example.com/music.mp3' })
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  profileMusicUrl?: string;

  @ApiPropertyOptional({ description: '프로필 이미지 URL', example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  avatarUrl?: string;
}

class UpdatePersonalInfoDto {
  @ApiPropertyOptional({ description: '이메일 주소', example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

class UpdateSkillDto {
  @ApiProperty({ description: '스킬 타입 ID (UUID)', example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID(undefined, { message: uuidValidationMessage })
  skillTypeId!: string;

  @ApiProperty({ enum: SkillLevelType, description: '스킬 숙련도', example: 'INTERMEDIATE' })
  @IsEnum(SkillLevelType, { message: enumValidationMessage })
  level!: SkillLevelType;

  @ApiProperty({ description: '주요 스킬 여부', example: true })
  @IsBoolean()
  isPrimary!: boolean;
}

export class UpdateUserProfileDto {
  @ApiPropertyOptional({ description: '프로필 정보', type: UpdateProfileDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProfileDto)
  profile?: UpdateProfileDto;

  @ApiPropertyOptional({ description: '개인 정보', type: UpdatePersonalInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePersonalInfoDto)
  personalInfo?: UpdatePersonalInfoDto;

  @ApiPropertyOptional({ description: '스킬 목록', type: [UpdateSkillDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSkillDto)
  skills?: UpdateSkillDto[];

  @ApiPropertyOptional({ description: '선호 장르 ID 목록 (UUID 배열)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true, message: uuidValidationMessage })
  favoriteGenres?: string[];
}

export type UpdateUserProfileData = UpdateUserProfileDto;

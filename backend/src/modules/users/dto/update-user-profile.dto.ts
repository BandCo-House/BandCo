import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEmail, IsEnum, IsOptional, IsString, IsUUID, ValidateNested } from 'class-validator';
import { enumValidationMessage } from 'src/common/validation-message/enum-validation.message';
import { stringValidationMessage } from 'src/common/validation-message/string-validation.message';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';
import { SkillLevelType } from 'src/generated/prisma';

class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  nickname?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  selfDescription?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  profileMusicUrl?: string;

  @IsOptional()
  @IsString({ message: stringValidationMessage })
  avatarUrl?: string;
}

class UpdatePersonalInfoDto {
  @IsOptional()
  @IsEmail()
  email?: string;
}

class UpdateSkillDto {
  @IsUUID(undefined, { message: uuidValidationMessage })
  skillTypeId!: string;

  @IsEnum(SkillLevelType, { message: enumValidationMessage })
  level!: SkillLevelType;

  @IsBoolean()
  isPrimary!: boolean;
}

export class UpdateUserProfileDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateProfileDto)
  profile?: UpdateProfileDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpdatePersonalInfoDto)
  personalInfo?: UpdatePersonalInfoDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSkillDto)
  skills?: UpdateSkillDto[];

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true, message: uuidValidationMessage })
  favoriteGenres?: string[];
}

export type UpdateUserProfileData = UpdateUserProfileDto;

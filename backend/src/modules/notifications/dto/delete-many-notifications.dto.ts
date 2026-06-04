import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';

export class DeleteManyNotificationsDto {
  @ApiProperty({ description: '삭제할 알림 ID 목록 (UUID 배열)', type: [String], example: ['550e8400-e29b-41d4-a716-446655440000'] })
  @IsArray()
  @IsUUID(undefined, { each: true, message: uuidValidationMessage })
  notificationIds!: string[];
}

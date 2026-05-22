import { IsArray, IsUUID } from 'class-validator';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';

export class DeleteManyNotificationsDto {
  @IsArray()
  @IsUUID(undefined, { each: true, message: uuidValidationMessage })
  notificationIds!: string[];
}

import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { uuidValidationMessage } from 'src/common/validation-message/uuid-validation.message';

export class TransferBandMasterDto {
  @ApiProperty({ description: '새 밴드장이 될 밴드 멤버의 유저 ID', example: '11111111-1111-4111-8111-111111111111' })
  @IsUUID(undefined, { message: uuidValidationMessage })
  userId: string;
}

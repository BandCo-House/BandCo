import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

import { normalizeOptionalStringValue } from '../../../common/validation/transform.util';
import { intValidationMessage } from '../../../common/validation-message/int-validation.message';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { minValidationMessage } from '../../../common/validation-message/min-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';
import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';

/** 질문 길이 상한. 프롬프트 크기와 토큰 비용을 입력 단계에서 제한한다. */
export const MAX_QUESTION_LENGTH = 200;

/**
 * 기록할 턴 순서의 상한. 넘어오면 400이 아니라 서버가 이 값으로 깎아서 기록한다.
 * 측정 필드가 조회를 막으면 측정을 끄게 되고, 실제 대화 길이 제한은 화면이 담당한다.
 */
export const MAX_TURN_INDEX = 100;

/**
 * 자유 질문과 추천 질문을 한 엔드포인트로 받는다.
 * 둘 중 하나만 있어야 한다는 규칙은 조합 검증이라 서비스에서 처리한다.
 */
export class AskAssistantBodyDto {
  @ApiPropertyOptional({ description: '자연어 질문', example: '다음 합주 일정이 언제야?', maxLength: MAX_QUESTION_LENGTH })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  @Length(2, MAX_QUESTION_LENGTH, { message: lengthValidationMessage })
  question?: string;

  @ApiPropertyOptional({ description: '추천 질문 ID. 해당 질문 문장을 Text-to-SQL로 처리한다.', example: 'next-schedule' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsString({ message: stringValidationMessage })
  presetId?: string;

  /**
   * 한 대화를 묶는 키다. 측정 전용이며 권한과 조회 범위에는 쓰이지 않는다.
   * 밴드 범위는 서버가 멤버십을 확인한 bandId로만 정하므로, 이 값을 바꿔도 보이는 데이터는 같다.
   */
  @ApiPropertyOptional({ description: '대화 세션 ID (UUID). 품질 측정에만 사용한다.', format: 'uuid' })
  @Transform(normalizeOptionalStringValue)
  @IsOptional()
  @IsUUID('4', { message: uuidValidationMessage })
  sessionId?: string;

  /**
   * 그 대화에서 몇 번째 질문인지. 0부터 시작한다.
   * 상한을 넘겨도 거절하지 않는다. 측정 필드 하나 때문에 조회가 실패하면 안 된다.
   */
  @ApiPropertyOptional({ description: `대화 안의 질문 순서. 0부터 시작하며 ${MAX_TURN_INDEX}을 넘으면 서버가 깎아 기록한다.`, minimum: 0 })
  @Type(() => Number)
  @IsOptional()
  @IsInt({ message: intValidationMessage })
  @Min(0, { message: minValidationMessage })
  turnIndex?: number;
}

export type AskAssistantInput = AskAssistantBodyDto;

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, Length } from 'class-validator';

import { normalizeOptionalStringValue } from '../../../common/validation/transform.util';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';

/** 질문 길이 상한. 프롬프트 크기와 토큰 비용을 입력 단계에서 제한한다. */
export const MAX_QUESTION_LENGTH = 200;

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
}

export type AskAssistantInput = AskAssistantBodyDto;

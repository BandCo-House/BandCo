import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

import { normalizeOptionalStringValue } from '../../../common/validation/transform.util';
import { booleanValidationMessage } from '../../../common/validation-message/boolean-validation.message';
import { enumValidationMessage } from '../../../common/validation-message/enum-validation.message';
import { intValidationMessage } from '../../../common/validation-message/int-validation.message';
import { lengthValidationMessage } from '../../../common/validation-message/length-validation.message';
import { maxValidationMessage } from '../../../common/validation-message/max-validation.message';
import { minValidationMessage } from '../../../common/validation-message/min-validation.message';
import { stringValidationMessage } from '../../../common/validation-message/string-validation.message';
import { uuidValidationMessage } from '../../../common/validation-message/uuid-validation.message';
import { MAX_ASSISTANT_RESULT_ROWS, SQL_PARAMETER_TYPES, SQL_RESULT_MODES, type SqlResultMode } from '../sql/generated-sql.type';

/** 질문 길이 상한. 프롬프트 크기와 토큰 비용을 입력 단계에서 제한한다. */
export const MAX_QUESTION_LENGTH = 200;

/** 모델에 함께 보내는 직전 턴 수. 오래된 턴은 지시어 해석에 거의 쓰이지 않고 토큰만 늘린다. */
export const MAX_HISTORY_TURNS = 3;

/**
 * 한 대화의 턴 상한. 감으로 정한 값이라 turnIndex별 실패율을 로그로 보고 조정한다.
 * 턴이 길어질수록 오래된 맥락이 해석을 흐리고 비용도 늘어난다.
 */
export const MAX_CONVERSATION_TURNS = 5;

/** 직전 SQL 길이 상한. 검증기의 SQL 상한보다 짧게 잡아 프롬프트가 이력으로 부풀지 않게 한다. */
const MAX_HISTORY_SQL_LENGTH = 4_000;

/** 직전 SQL의 파라미터. 검증기가 실행 SQL과 같은 규칙으로 다시 확인한다. */
export class AssistantHistoryParameterDto {
  @ApiProperty({ description: 'SQL 파라미터 위치($2부터)', example: 2 })
  @IsInt({ message: intValidationMessage })
  @Min(2, { message: minValidationMessage })
  position!: number;

  @ApiProperty({ description: '파라미터 타입', enum: SQL_PARAMETER_TYPES })
  @IsIn(SQL_PARAMETER_TYPES, { message: enumValidationMessage })
  type!: string;

  @ApiProperty({ description: '파라미터 값', example: 'ATTENDING' })
  @IsString({ message: stringValidationMessage })
  @MaxLength(MAX_QUESTION_LENGTH, { message: maxValidationMessage })
  value!: string;
}

/**
 * 같은 대화의 직전 턴. "그중에"처럼 앞 결과를 가리키는 질문을 해석하는 데 쓴다.
 * 결과 행과 답 문장은 받지 않는다. 행은 밴드 데이터라 토큰·프라이버시 부담이 있고, 답 문장은 맥락을 불필요하게 키운다.
 */
export class AssistantHistoryTurnDto {
  @ApiProperty({ description: '직전 질문', example: '다음 합주에 참석하는 사람은 누구야?', maxLength: MAX_QUESTION_LENGTH })
  @IsString({ message: stringValidationMessage })
  @Length(2, MAX_QUESTION_LENGTH, { message: lengthValidationMessage })
  question!: string;

  @ApiProperty({ description: '직전 조회 의도', example: '다음 합주 참석자 명단' })
  @IsString({ message: stringValidationMessage })
  @MaxLength(MAX_QUESTION_LENGTH, { message: maxValidationMessage })
  intent!: string;

  @ApiProperty({ description: '직전에 검증을 통과한 SQL. 서버가 다시 검증한 뒤에만 사용한다.' })
  @IsString({ message: stringValidationMessage })
  @MaxLength(MAX_HISTORY_SQL_LENGTH, { message: maxValidationMessage })
  sql!: string;

  @ApiProperty({ description: '직전 SQL의 파라미터', type: [AssistantHistoryParameterDto] })
  @IsArray()
  @ArrayMaxSize(8)
  @ValidateNested({ each: true })
  @Type(() => AssistantHistoryParameterDto)
  params!: AssistantHistoryParameterDto[];

  @ApiPropertyOptional({ description: '직전 결과 유형', enum: SQL_RESULT_MODES })
  @IsOptional()
  @IsIn(SQL_RESULT_MODES, { message: enumValidationMessage })
  resultMode?: SqlResultMode;

  @ApiProperty({ description: '직전 결과 행 수', example: 6 })
  @IsInt({ message: intValidationMessage })
  @Min(0, { message: minValidationMessage })
  @Max(MAX_ASSISTANT_RESULT_ROWS, { message: maxValidationMessage })
  rowCount!: number;

  @ApiProperty({ description: '직전 결과가 50건을 넘었는지 여부', example: false })
  @IsBoolean({ message: booleanValidationMessage })
  hasMore!: boolean;
}

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

  @ApiPropertyOptional({ description: '같은 대화의 직전 턴(최대 3개, 오래된 것부터)', type: [AssistantHistoryTurnDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_HISTORY_TURNS)
  @ValidateNested({ each: true })
  @Type(() => AssistantHistoryTurnDto)
  history?: AssistantHistoryTurnDto[];

  @ApiPropertyOptional({ description: '대화에서 이 질문이 몇 번째인지(1부터, 최대 5)', example: 2 })
  @IsOptional()
  @IsInt({ message: intValidationMessage })
  @Min(1, { message: minValidationMessage })
  @Max(MAX_CONVERSATION_TURNS, { message: maxValidationMessage })
  turnIndex?: number;
}

export type AskAssistantInput = AskAssistantBodyDto;

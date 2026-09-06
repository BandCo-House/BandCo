import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';

import type { ApiFailResponse } from '../api-response';

const DEFAULT_SERVER_ERROR_MESSAGE = '서버 오류가 발생했습니다.';

/** 상태 코드에 대응하는 응답 객체의 최소 형태. express Response 타입 의존을 피한다 */
interface JsonResponse {
  status(code: number): { json(body: unknown): void };
}

/**
 * Nest 기본 예외 payload(`string` 또는 `{ statusCode, message, error }`)에서 사용자 노출 메시지를 뽑는다.
 * class-validator 오류처럼 message가 배열이면 줄바꿈으로 합친다.
 */
export function extractExceptionMessage(payload: string | object): string {
  if (typeof payload === 'string') return payload;

  const message = (payload as { message?: unknown }).message;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.filter((item): item is string => typeof item === 'string').join('\n');

  return DEFAULT_SERVER_ERROR_MESSAGE;
}

/**
 * 모든 예외를 `ApiFailResponse`(`status: 'fail'`) 형식으로 통일해 응답한다.
 *
 * - HttpException: 상태 코드와 메시지를 그대로 쓴다. `error.code`는 HTTP 상태 이름(NOT_FOUND 등)이다.
 * - 그 외 예외: 500으로 응답하고 원인은 서버 로그에만 남긴다.
 * 성공 응답(`createSuccessResponse`)과 같은 envelope 키(status/error/message/data)를 유지한다.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<JsonResponse>();
    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = isHttpException ? extractExceptionMessage(exception.getResponse()) : DEFAULT_SERVER_ERROR_MESSAGE;

    if (statusCode >= 500) {
      this.logger.error(exception instanceof Error ? (exception.stack ?? exception.message) : String(exception));
    }

    const body: ApiFailResponse = {
      status: 'fail',
      error: {
        code: HttpStatus[statusCode] ?? 'UNKNOWN',
        details: { statusCode },
      },
      message,
      data: {},
    };

    response.status(statusCode).json(body);
  }
}

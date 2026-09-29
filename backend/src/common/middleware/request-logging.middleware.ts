import { Logger } from '@nestjs/common';

import { getRequestPath, type LoggedRequest } from '../logging/request-path';

const logger = new Logger('RequestLogging');

/** 가드와 DTO 검증 실패까지 기록하기 위해 HTTP 응답이 끝난 시점에 요청을 기록한다. */
export function requestLoggingMiddleware(
  request: LoggedRequest,
  response: { statusCode: number; once(event: 'finish', listener: () => void): unknown },
  next: () => void,
): void {
  const startedAt = Date.now();

  response.once('finish', () => {
    const userId = request.user?.id;
    logger.log({
      message: 'HTTP request',
      method: request.method,
      path: getRequestPath(request),
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt,
      userId: userId ?? null,
    });
  });

  next();
}

import { EventEmitter } from 'node:events';

import { Logger } from '@nestjs/common';

import type { LoggedRequest } from '../logging/request-path';

import { requestLoggingMiddleware } from './request-logging.middleware';

describe('requestLoggingMiddleware', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('응답 완료 후 상태와 소요 시간 및 인증된 사용자 ID를 기록한다', () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const request = {
      method: 'POST',
      baseUrl: '',
      route: { path: '/bandspaces/:bandspaceId/schedules' },
      originalUrl: '/bandspaces/private/schedules?token=secret',
      body: { title: '비밀 일정' },
      user: { id: 'user-1' },
    } as LoggedRequest;
    const response = Object.assign(new EventEmitter(), { statusCode: 400 });
    const next = jest.fn();
    const now = jest.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1025);

    requestLoggingMiddleware(request, response, next);
    response.emit('finish');

    expect(next).toHaveBeenCalledTimes(1);
    expect(now).toHaveBeenCalledTimes(2);
    expect(log).toHaveBeenCalledWith({
      message: 'HTTP request',
      method: 'POST',
      path: '/bandspaces/:bandspaceId/schedules',
      statusCode: 400,
      durationMs: 25,
      userId: 'user-1',
    });
  });

  it('라우트가 없는 요청은 입력한 경로와 쿼리를 기록하지 않는다', () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    const request = { method: 'GET', baseUrl: '', originalUrl: '/secret?token=private' } as LoggedRequest;
    const response = Object.assign(new EventEmitter(), { statusCode: 404 });
    const next = jest.fn();

    requestLoggingMiddleware(request, response, next);
    response.emit('finish');

    expect(log).toHaveBeenCalledWith(expect.objectContaining({ path: '<unmatched>', statusCode: 404, userId: null }));
  });
});

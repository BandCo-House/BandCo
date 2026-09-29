import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';

import { ApiExceptionFilter, extractExceptionMessage } from './api-exception.filter';

// ArgumentsHost에서 response만 흉내 내는 최소 스텁
const createHost = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const request: { method: string; baseUrl: string; route?: { path: string } } = {
    method: 'POST',
    baseUrl: '',
    route: { path: '/bandspaces/:bandspaceId/schedules' },
  };
  const host = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => ({ status }) }) } as unknown as ArgumentsHost;
  return { host, status, json, request };
};

describe('extractExceptionMessage', () => {
  it('문자열 payload는 그대로 반환한다', () => {
    expect(extractExceptionMessage('그대로')).toBe('그대로');
  });

  it('message가 배열이면 줄바꿈으로 합친다', () => {
    expect(extractExceptionMessage({ statusCode: 400, message: ['a', 'b'], error: 'Bad Request' })).toBe('a\nb');
  });

  it('message가 없으면 기본 서버 오류 문구를 반환한다', () => {
    expect(extractExceptionMessage({ statusCode: 500 })).toBe('서버 오류가 발생했습니다.');
  });
});

describe('ApiExceptionFilter', () => {
  const filter = new ApiExceptionFilter();

  beforeEach(() => {
    jest.spyOn(filter['logger'], 'error').mockImplementation(() => undefined);
    jest.spyOn(filter['logger'], 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('400 검증 실패는 요청 본문 없이 메서드와 라우트 및 메시지만 warn으로 남긴다', () => {
    const { host } = createHost();

    filter.catch(new BadRequestException('genreId는 유효한 uuid이어야 합니다.'), host);

    expect(filter['logger'].warn).toHaveBeenCalledWith({
      message: 'genreId는 유효한 uuid이어야 합니다.',
      method: 'POST',
      path: '/bandspaces/:bandspaceId/schedules',
      statusCode: 400,
    });
  });

  it('일치하지 않는 경로의 404 메시지에서는 원본 URL을 로그에 남기지 않는다', () => {
    const { host, request } = createHost();
    delete request.route;

    filter.catch(new NotFoundException('Cannot GET /private-token'), host);

    expect(filter['logger'].warn).toHaveBeenCalledWith({
      message: 'NOT_FOUND',
      method: 'POST',
      path: '<unmatched>',
      statusCode: 404,
    });
  });

  it('HttpException은 상태 코드와 메시지를 fail envelope으로 응답한다', () => {
    const { host, status, json } = createHost();

    filter.catch(new NotFoundException('존재하지 않는 유저입니다.'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      status: 'fail',
      error: { code: 'NOT_FOUND', details: { statusCode: 404 } },
      message: '존재하지 않는 유저입니다.',
      data: {},
    });
  });

  it('class-validator 배열 메시지는 줄바꿈으로 합쳐 응답한다', () => {
    const { host, json } = createHost();

    filter.catch(new BadRequestException(['name must be a string', 'name should not be empty']), host);

    expect(json).toHaveBeenCalledWith(expect.objectContaining({ status: 'fail', message: 'name must be a string\nname should not be empty' }));
  });

  it('문자열 payload의 HttpException도 메시지를 그대로 쓴다', () => {
    const { host, status, json } = createHost();

    filter.catch(new HttpException('직접 문자열', HttpStatus.CONFLICT), host);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: '직접 문자열', error: expect.objectContaining({ code: 'CONFLICT' }) }));
  });

  it('HttpException이 아닌 예외는 500과 기본 문구로 응답하고 원인은 노출하지 않는다', () => {
    const { host, status, json } = createHost();

    filter.catch(new Error('db connection lost'), host);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      status: 'fail',
      error: { code: 'INTERNAL_SERVER_ERROR', details: { statusCode: 500 } },
      message: '서버 오류가 발생했습니다.',
      data: {},
    });
    expect(filter['logger'].error).toHaveBeenCalled();
  });
});

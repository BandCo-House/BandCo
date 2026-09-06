import type { ArgumentsHost } from '@nestjs/common';
import { BadRequestException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';

import { ApiExceptionFilter, extractExceptionMessage } from './api-exception.filter';

// ArgumentsHost에서 response만 흉내 내는 최소 스텁
const createHost = () => {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const host = { switchToHttp: () => ({ getResponse: () => ({ status }) }) } as unknown as ArgumentsHost;
  return { host, status, json };
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

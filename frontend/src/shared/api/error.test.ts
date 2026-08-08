import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';
import { getApiErrorMessage } from './error';

const FALLBACK = '회원가입에 실패했습니다.';

/**
 * 주어진 응답 본문을 가진 axios 에러를 만든다.
 */
const createAxiosError = (data: unknown): AxiosError => {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('request failed', 'ERR_BAD_REQUEST', config, null, {
    status: 400,
    statusText: 'Bad Request',
    headers: new AxiosHeaders(),
    config,
    data,
  });
};

describe('getApiErrorMessage', () => {
  it('message가 문자열이면 그대로 반환한다', () => {
    const error = createAxiosError({ message: '이미 존재하는 이메일입니다.' });
    expect(getApiErrorMessage(error, FALLBACK)).toBe(
      '이미 존재하는 이메일입니다.',
    );
  });

  it('message가 문자열 배열이면 줄바꿈으로 합친다', () => {
    const error = createAxiosError({
      message: ['비밀번호는 숫자를 1개 이상 포함해야 합니다.', 'name 필수'],
    });
    expect(getApiErrorMessage(error, FALLBACK)).toBe(
      '비밀번호는 숫자를 1개 이상 포함해야 합니다.\nname 필수',
    );
  });

  it('axios 에러가 아니면 fallback을 반환한다', () => {
    expect(getApiErrorMessage(new Error('boom'), FALLBACK)).toBe(FALLBACK);
  });

  it.each([
    ['숫자', 42],
    ['객체', { code: 'P2002' }],
    ['문자열이 섞인 배열', ['정상 메시지', 42]],
    ['null', null],
    ['빈 배열', []],
    ['공백 문자열', '   '],
  ])('message가 %s이면 fallback을 반환한다', (_label, message) => {
    const error = createAxiosError({ message });
    expect(getApiErrorMessage(error, FALLBACK)).toBe(FALLBACK);
  });

  it('응답 본문이 객체가 아니어도 예외 없이 fallback을 반환한다', () => {
    expect(getApiErrorMessage(createAxiosError('plain text'), FALLBACK)).toBe(
      FALLBACK,
    );
  });

  it('응답이 없으면 fallback을 반환한다', () => {
    expect(getApiErrorMessage(new AxiosError('timeout'), FALLBACK)).toBe(
      FALLBACK,
    );
  });
});

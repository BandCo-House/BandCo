import { getRequestPath } from './request-path';

describe('getRequestPath', () => {
  it('등록된 API는 입력값 대신 라우트 템플릿을 기록한다', () => {
    expect(
      getRequestPath({
        method: 'GET',
        baseUrl: '',
        path: '/bands/private-id/songs',
        route: { path: '/bands/:bandId/songs' },
      }),
    ).toBe('/bands/:bandId/songs');
  });

  it('미등록 경로에서는 쿼리와 경로 안의 식별자를 가린다', () => {
    expect(getRequestPath({ method: 'GET', baseUrl: '', path: '/bands/123/notices?token=private' })).toBe('/bands/:value/notices');
    expect(getRequestPath({ method: 'GET', baseUrl: '', path: '/reset/short-secret' })).toBe('/reset/:value');
    expect(getRequestPath({ method: 'GET', baseUrl: '', path: '/users/jun%40example.com' })).toBe('/users/:value');
  });

  it('탐색 경로는 표시하고 경로가 없거나 너무 길면 숨긴다', () => {
    expect(getRequestPath({ method: 'GET', baseUrl: '', path: '/.git/config' })).toBe('/.git/config');
    expect(getRequestPath({ method: 'GET', baseUrl: '' })).toBe('<unmatched>');
    expect(getRequestPath({ method: 'GET', baseUrl: '', path: `/${'a/'.repeat(120)}` })).toBe('<unmatched:long-path>');
  });
});

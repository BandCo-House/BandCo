import { describe, expect, it } from 'vitest';
import { resolveHeader } from './resolve-header';

describe('resolveHeader', () => {
  it('header static data가 없으면 null을 반환한다', () => {
    const resolved = resolveHeader(undefined, {
      params: {},
      loaderData: undefined,
    });

    expect(resolved).toBeNull();
  });

  it('resolve 결과를 static header와 병합하고 기본값을 채운다', () => {
    const resolved = resolveHeader(
      {
        header: {
          title: '기본 제목',
          subtitle: '기본 부제',
          resolve: () => ({
            title: '동적 제목',
          }),
        },
      },
      {
        params: {},
        loaderData: undefined,
      },
    );

    expect(resolved).toEqual({
      showBack: true,
      backBehavior: 'route',
      bottomBlur: true,
      title: '동적 제목',
      subtitle: '기본 부제',
      resolve: expect.any(Function),
    });
  });
});

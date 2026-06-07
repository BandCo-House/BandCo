import { buildNextPath } from './url.util';

describe('buildNextPath', () => {
  it('모든 params를 쿼리 문자열로 반환한다', () => {
    const result = buildNextPath('/notifications/me', {
      order__created_at: 'desc',
      order__id: 'desc',
      take: 20,
      cursor__id: 'some-uuid',
    });

    expect(result).toBe('/notifications/me?order__created_at=desc&order__id=desc&take=20&cursor__id=some-uuid');
  });

  it('undefined 값인 키는 쿼리 문자열에서 제외한다', () => {
    const result = buildNextPath('/notifications/me', {
      where__is_read: undefined,
      where__type: undefined,
      order__id: 'desc',
    });

    expect(result).toBe('/notifications/me?order__id=desc');
  });

  it('null 값인 키는 쿼리 문자열에서 제외한다', () => {
    const result = buildNextPath('/notifications/me', {
      where__type: null,
      order__id: 'asc',
    });

    expect(result).toBe('/notifications/me?order__id=asc');
  });

  it('params가 비어있으면 basePath?를 반환한다', () => {
    const result = buildNextPath('/bands', {});

    expect(result).toBe('/bands?');
  });

  it('boolean 값을 문자열로 변환한다', () => {
    const result = buildNextPath('/notifications/me', {
      where__is_read: false,
    });

    expect(result).toBe('/notifications/me?where__is_read=false');
  });

  it('number 값을 문자열로 변환한다', () => {
    const result = buildNextPath('/bands', {
      take: 20,
    });

    expect(result).toBe('/bands?take=20');
  });
});

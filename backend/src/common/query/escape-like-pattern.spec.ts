import { escapeLikePattern } from './escape-like-pattern';

describe('escapeLikePattern', () => {
  it('%, _, \\ 앞에 \\를 붙인다', () => {
    expect(escapeLikePattern('a%b_c\\d')).toBe('a\\%b\\_c\\\\d');
  });

  it('메타문자가 없으면 그대로 돌려준다', () => {
    expect(escapeLikePattern('devjun@example.com')).toBe('devjun@example.com');
  });
});

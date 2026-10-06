import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn — typo 그룹', () => {
  it('뒤에 온 typo-*가 이긴다', () => {
    expect(cn('typo-sm-r', 'typo-lg-sb')).toBe('typo-lg-sb');
    expect(cn('typo-lg-sb', 'typo-xl-sb')).toBe('typo-xl-sb');
    expect(cn('typo-lg-sb', 'typo-lg-b')).toBe('typo-lg-b');
  });

  it('typo가 아닌 클래스는 그대로 남는다', () => {
    expect(cn('typo-sm-r text-grey-100', 'typo-lg-sb')).toBe(
      'text-grey-100 typo-lg-sb',
    );
  });
});

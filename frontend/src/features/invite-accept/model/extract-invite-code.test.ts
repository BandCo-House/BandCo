import { describe, expect, it } from 'vitest';
import { extractInviteCode } from './extract-invite-code';

describe('extractInviteCode', () => {
  it('코드만 입력하면 공백을 제거하고 그대로 돌려준다', () => {
    expect(extractInviteCode('  INV123  ')).toBe('INV123');
  });

  it('초대 링크 전체를 붙여넣으면 코드만 뽑는다', () => {
    expect(extractInviteCode('https://funda.website/invite/INV123')).toBe(
      'INV123',
    );
  });

  it('링크 뒤에 쿼리나 해시가 붙어도 코드만 남긴다', () => {
    expect(extractInviteCode('https://funda.website/invite/INV123?utm=x')).toBe(
      'INV123',
    );
    expect(extractInviteCode('https://funda.website/invite/INV123#top')).toBe(
      'INV123',
    );
    expect(extractInviteCode('https://funda.website/invite/INV123/')).toBe(
      'INV123',
    );
  });

  it('쿼리에 다른 /invite/가 섞여 있어도 경로의 코드를 쓴다', () => {
    expect(
      extractInviteCode('https://funda.website/invite/REAL?next=/invite/OTHER'),
    ).toBe('REAL');
  });

  it('scheme 없는 주소도 코드를 뽑는다', () => {
    expect(extractInviteCode('funda.website/invite/INV123?utm=x')).toBe(
      'INV123',
    );
  });

  it('코드 없이 /invite/로 끝나는 잘린 링크는 원문을 돌려준다', () => {
    expect(extractInviteCode('https://funda.website/invite/')).toBe(
      'https://funda.website/invite/',
    );
  });

  it('/invite/가 없는 문자열은 손대지 않는다', () => {
    expect(extractInviteCode('https://funda.website/band/abc')).toBe(
      'https://funda.website/band/abc',
    );
  });
});

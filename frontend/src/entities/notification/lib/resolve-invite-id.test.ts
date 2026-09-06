import { describe, expect, it } from 'vitest';
import { resolveInviteId } from './resolve-invite-id';

describe('resolveInviteId', () => {
  it('reference.id가 존재하면 우선적으로 반환한다', () => {
    const result = resolveInviteId({
      reference: {
        type: 'BAND_INVITATION',
        id: 'ref-123',
        status: 'PENDING',
        sender: null,
      },
      targetPath: '/notifications?invitationId=path-456',
    });
    expect(result).toBe('ref-123');
  });

  it('targetPath의 URL 해시(#detail)가 포함되어 있어도 순수한 invitationId만 파싱한다', () => {
    const result = resolveInviteId({
      reference: null,
      targetPath: '/notifications?invitationId=pure-id-789#detail',
    });
    expect(result).toBe('pure-id-789');
  });

  it('유효하지 않은 URL이거나 파라미터가 없으면 빈 문자열을 반환한다', () => {
    expect(resolveInviteId(null)).toBe('');
    expect(resolveInviteId({ targetPath: '/invalid-path-without-id' })).toBe(
      '',
    );
  });
});

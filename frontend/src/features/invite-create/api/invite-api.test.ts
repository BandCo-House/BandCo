import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { createInvite } from './invite-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('invite create 어댑터', () => {
  it('유저 ID로 밴드 초대를 생성하고 envelope의 data를 반환한다', async () => {
    const requestBody = { inviteeUserId: 'user-2' };

    mock.onPost('/bands/band-1/invitations', requestBody).reply(201, {
      status: 'success',
      error: null,
      message: '밴드 초대 전송 완료',
      data: {
        invitationId: 'invite-1',
        bandId: 'band-1',
        inviterUserId: 'user-1',
        inviteeUserId: 'user-2',
        invitationStatus: 'PENDING',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    });

    const result = await createInvite('band-1', requestBody);

    expect(result.invitationId).toBe('invite-1');
    expect(result.inviteeUserId).toBe('user-2');
  });
});

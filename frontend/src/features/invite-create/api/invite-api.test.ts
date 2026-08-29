import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { createInvite } from './invite-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('invite create 어댑터', () => {
  it('밴드 초대를 생성한다', async () => {
    const requestBody = { inviteeEmail: 'member@example.com' };

    mock.onPost('/bands/band-1/invitations', requestBody).reply(200, {
      success: true,
      data: {
        id: 'invite-1',
        bandId: 'band-1',
        bandName: '신촌 락밴드',
        inviteeEmail: 'member@example.com',
        inviteCode: 'INV-team-1-DEMO1',
        inviteLink: 'https://example.com/invites/demo',
        token: 'token-1',
        status: 'PENDING',
      },
    });

    const result = await createInvite('band-1', requestBody);

    expect(result.inviteeEmail).toBe('member@example.com');
  });
});

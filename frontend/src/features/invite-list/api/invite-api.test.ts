import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { getInvites } from './invite-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('invite list 어댑터', () => {
  it('초대 목록을 조회한다', async () => {
    mock
      .onGet('/invites/band-1', { params: { page: 1, size: 10 } })
      .reply(200, {
        success: true,
        data: [
          {
            id: 'invite-1',
            bandId: 'band-1',
            bandName: '신촌 락밴드',
            inviteeEmail: 'member@example.com',
            inviteCode: 'INV-team-1-DEMO1',
            inviteLink: 'https://example.com/invites/demo',
            token: 'token-1',
            status: 'PENDING',
          },
        ],
      });

    const result = await getInvites('band-1', { page: 1, size: 10 });

    expect(result[0]?.bandName).toBe('신촌 락밴드');
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { acceptInvite } from './invite-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('invite accept 어댑터', () => {
  it('초대를 수락한다', async () => {
    mock.onPost('/invites/token-1/accept').reply(200, {
      success: true,
      data: undefined,
    });

    await expect(acceptInvite('token-1')).resolves.toBeUndefined();
  });
});

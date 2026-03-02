import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { declineInvite } from './invite-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('invite decline 어댑터', () => {
  it('초대를 거절한다', async () => {
    mock.onPost('/invites/token-2/decline').reply(200, {
      success: true,
      data: undefined,
    });

    await expect(declineInvite('token-2')).resolves.toBeUndefined();
  });
});

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
    mock.onPost('/invitations/invite-id-2/decline').reply(200, {
      status: 'success',
      error: null,
      message: '요청 성공',
      data: undefined,
    });

    await expect(declineInvite('invite-id-2')).resolves.toBeUndefined();
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api';
import { acceptInvite, getReceivedInvitations } from './invite-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('invite accept 어댑터', () => {
  it('초대를 수락한다', async () => {
    const mockResponse = {
      invitationId: 'invite-id-1',
      bandId: 'band-123',
      userId: 'user-123',
      invitationStatus: 'ACCEPTED',
      joinedAt: '2026-06-12T00:00:00Z',
    };

    mock.onPost('/invitations/invite-id-1/accept').reply(200, {
      status: 'success',
      error: null,
      message: '요청 성공',
      data: mockResponse,
    });

    await expect(acceptInvite('invite-id-1')).resolves.toEqual(mockResponse);
  });

  it('받은 초대 목록을 조회한다', async () => {
    const mockResponse = {
      status: 'success',
      error: null,
      message: '받은 초대 목록 조회 성공',
      data: {
        items: [
          {
            invitationId: 'uuid-1',
            band: {
              bandId: 'band-1',
              name: '합주하자 밴드',
              description: '설명',
            },
            inviter: {
              userId: 'user-sender-1',
              nickname: '김민준1',
            },
            message: '초대 메시지',
            invitationStatus: 'PENDING',
            createdAt: '2026-07-19T08:29:24.000Z',
          },
        ],
        meta: {
          count: 1,
          take: 20,
          totalCount: 1,
          cursor: null,
          next: null,
        },
      },
    };

    mock
      .onGet('/invitations/received', {
        params: { where__invitation_status: 'PENDING' },
      })
      .reply(200, mockResponse);

    await expect(
      getReceivedInvitations({ where__invitation_status: 'PENDING' }),
    ).resolves.toEqual(mockResponse.data);
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { getBands } from './band-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('getBands 어댑터', () => {
  it('GET /bands/me 응답을 schema로 검증한 뒤 bands를 반환한다', async () => {
    mock.onGet('/bands/me').reply(200, {
      status: 'success',
      error: null,
      message: '내 밴드 목록 조회 성공',
      data: {
        items: [
          {
            id: 'band-1',
            name: '합주하자',
            description: '주 1회 합주',
            visibility: true,
            inviteCode: 'INV123',
            myRole: 'BM',
            joinedAt: '2026-03-01T12:10:00.000+09:00',
            createdAt: '2026-03-01T12:00:00.000+09:00',
            memberCount: 10,
          },
        ],
        meta: {
          count: 1,
          take: 20,
          cursor: null,
          next: null,
        },
      },
    });

    await expect(getBands()).resolves.toEqual([
      {
        id: 'band-1',
        name: '합주하자',
        description: '주 1회 합주',
        visibility: true,
        inviteCode: 'INV123',
        myRole: 'BM',
        joinedAt: '2026-03-01T12:10:00.000+09:00',
        createdAt: '2026-03-01T12:00:00.000+09:00',
        memberCount: 10,
      },
    ]);
  });

  it('필수 필드가 누락되면 reject된다', async () => {
    mock.onGet('/bands/me').reply(200, {
      status: 'success',
      error: null,
      message: '내 밴드 목록 조회 성공',
      data: {
        items: [
          {
            id: 'band-1',
            name: '합주하자',
            description: '주 1회 합주',
            visibility: true,
            inviteCode: 'INV123',
            myRole: 'BM',
            createdAt: '2026-03-01T12:00:00.000+09:00',
          },
        ],
      },
    });

    await expect(getBands()).rejects.toThrow();
  });
});

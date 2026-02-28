import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { getMyProfile } from './profile-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('profile get 어댑터', () => {
  it('내 프로필을 조회한다', async () => {
    mock.onGet('/me/profile').reply(200, {
      success: true,
      data: {
        id: 'profile-1',
        nickname: '김민준',
        displayName: '김민준',
        bio: '음악으로 세상과 소통하는 기타리스트',
        preferredGenres: ['Rock', 'J-Pop'],
        profileMusic: {
          title: 'Time of our life',
          artistName: 'Day6',
          url: null,
        },
        bandSummaries: [
          { id: 'band-1', name: '신촌 락밴드' },
          { id: 'band-2', name: '홍대 인디즈' },
        ],
        skills: ['일렉기타', '통기타'],
      },
    });

    const result = await getMyProfile();

    expect(result.displayName).toBe('김민준');
  });
});

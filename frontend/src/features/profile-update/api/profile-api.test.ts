import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { updateMyProfile } from './profile-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('profile update 어댑터', () => {
  it('내 프로필을 수정한다', async () => {
    const requestBody = {
      bio: '수정된 소개',
      preferredGenres: ['Rock'],
      skills: ['일렉기타'],
    };

    mock.onPatch('/me/profile', requestBody).reply(200, {
      success: true,
      data: {
        id: 'profile-1',
        nickname: '김민준',
        displayName: '김민준',
        bio: '수정된 소개',
        preferredGenres: ['Rock'],
        profileMusic: null,
        bandSummaries: [],
        skills: ['일렉기타'],
      },
    });

    const result = await updateMyProfile(requestBody);

    expect(result.bio).toBe('수정된 소개');
  });
});

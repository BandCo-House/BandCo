import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { updateMyProfile } from './profile-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('profile update 어댑터', () => {
  it('내 프로필 통합 수정 요청은 변경된 영역 플래그를 반환해야 한다', async () => {
    const requestBody = {
      profile: {
        nickname: 'devjun',
        selfDescription: '기타 좋아함',
      },
      personalInfo: {
        email: 'newmail@gmail.com',
      },
      skills: [
        {
          skillTypeId: 'electric-guitar',
          level: 'ADVANCED' as const,
          isPrimary: true,
        },
      ],
      favoriteGenres: ['rock'],
    };

    mock.onPatch('/me/profile', requestBody).reply(200, {
      success: true,
      data: {
        updated: {
          profile: true,
          personalInfo: true,
          skills: true,
          favoriteGenres: true,
        },
      },
    });

    const result = await updateMyProfile(requestBody);

    expect(result.updated).toEqual({
      profile: true,
      personalInfo: true,
      skills: true,
      favoriteGenres: true,
    });
  });
});

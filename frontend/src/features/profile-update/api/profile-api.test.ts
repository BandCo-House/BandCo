import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { updateUserProfile } from './profile-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('profile update 어댑터', () => {
  it('유저 프로필 수정 요청 시 업데이트된 프로필을 반환한다', async () => {
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

    const mockData = {
      user: {
        id: 'user-001',
        email: 'newmail@gmail.com',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      profile: {
        nickname: 'devjun',
        selfDescription: '기타 좋아함',
        profileMusicUrl: null,
        avatarUrl: null,
      },
      skills: [
        { skillTypeId: 'electric-guitar', skillName: 'Guitar', level: 'ADVANCED', isPrimary: true },
      ],
      favoriteGenres: [
        { genreId: 'rock', name: 'Rock' },
      ],
    };

    mock.onPatch('/users/user-001/profiles', requestBody).reply(200, {
      status: 'success',
      error: null,
      message: '수정 성공',
      data: mockData,
    });

    const result = await updateUserProfile('user-001', requestBody);

    expect(result.profile?.nickname).toBe('devjun');
    expect(result.user.email).toBe('newmail@gmail.com');
  });
});

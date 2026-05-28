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

  it('userId에 특수문자가 포함된 경우 안전하게 인코딩하여 PATCH 요청을 보낸다', async () => {
    const requestBody = { profile: { nickname: '특수문자수정' } };
    const mockData = {
      user: { id: 'user/001', email: 'test@example.com' },
      profile: { nickname: '특수문자수정' },
    };

    // 'user/001' -> 'user%2F001'
    mock.onPatch('/users/user%2F001/profiles', requestBody).reply(200, {
      status: 'success',
      error: null,
      message: '수정 성공',
      data: mockData,
    });

    const result = await updateUserProfile('user/001', requestBody);
    expect(result.profile?.nickname).toBe('특수문자수정');
  });

  it('userId가 빈 문자열이거나 공백만 있는 경우 rejected promise를 반환한다', async () => {
    const requestBody = { profile: { nickname: '에러' } };
    await expect(updateUserProfile('', requestBody)).rejects.toThrow('userId is required');
    await expect(updateUserProfile('   ', requestBody)).rejects.toThrow('userId is required');
  });
});

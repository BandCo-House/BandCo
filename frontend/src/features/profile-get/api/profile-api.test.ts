import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { getUserProfile } from './profile-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

describe('profile get 어댑터', () => {
  it('유저 프로필을 조회한다', async () => {
    const mockData = {
      user: {
        id: 'user-001',
        email: 'test@example.com',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      profile: {
        nickname: '김민준',
        selfDescription: '기타리스트입니다',
        profileMusicUrl: 'https://example.com/song.mp3',
        avatarUrl: null,
      },
      skills: [
        { skillTypeId: 'skill-1', skillName: 'Guitar', level: 'ADVANCED', isPrimary: true },
      ],
      favoriteGenres: [
        { genreId: 'genre-1', name: 'Rock' },
      ],
    };

    mock.onGet('/users/user-001/profiles').reply(200, {
      status: 'success',
      error: null,
      message: '조회 성공',
      data: mockData,
    });

    const result = await getUserProfile('user-001');

    expect(result.profile?.nickname).toBe('김민준');
    expect(result.user.id).toBe('user-001');
  });

  it('userId에 특수문자가 포함된 경우 안전하게 인코딩하여 요청한다', async () => {
    const mockData = {
      user: { id: 'user/001' },
      profile: { nickname: '특수문자' },
    };

    // 'user/001' -> 'user%2F001'
    mock.onGet('/users/user%2F001/profiles').reply(200, {
      status: 'success',
      error: null,
      message: '조회 성공',
      data: mockData,
    });

    const result = await getUserProfile('user/001');
    expect(result.user.id).toBe('user/001');
  });

  it('userId가 빈 문자열이거나 공백만 있는 경우 에러를 던진다', async () => {
    await expect(getUserProfile('')).rejects.toThrow('userId is required');
    await expect(getUserProfile('   ')).rejects.toThrow('userId is required');
  });
});

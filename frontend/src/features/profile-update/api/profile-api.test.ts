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
        profileMusic: null,
        avatarUrl: null,
      },
      skills: [
        {
          skillTypeId: 'electric-guitar',
          skillName: 'Guitar',
          level: 'ADVANCED',
          isPrimary: true,
        },
      ],
      favoriteGenres: [{ genreId: 'rock', name: 'Rock' }],
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

  it('프로필 이미지 업로드 시 FormData를 그대로 전송한다', async () => {
    const formData = new FormData();
    formData.append(
      'profile',
      new Blob(
        [
          JSON.stringify({
            nickname: 'devjun',
            selfDescription: '기타 좋아함',
            profileMusic: null,
          }),
        ],
        { type: 'application/json' },
      ),
    );
    formData.append(
      'skills',
      JSON.stringify([
        {
          skillTypeId: 'electric-guitar',
          level: 'ADVANCED',
          isPrimary: true,
        },
      ]),
    );
    formData.append('favoriteGenres', JSON.stringify(['rock']));
    formData.append(
      'avatar',
      new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' }),
    );

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
        profileMusic: null,
        avatarUrl: 'https://example.com/avatar.jpg',
      },
      skills: [
        {
          skillTypeId: 'electric-guitar',
          skillName: 'Guitar',
          level: 'ADVANCED',
          isPrimary: true,
        },
      ],
      favoriteGenres: [{ genreId: 'rock', name: 'Rock' }],
    };

    mock.onPatch('/users/user-001/profiles').reply((config) => {
      expect(config.data).toBeInstanceOf(FormData);
      const requestBody = config.data as FormData;
      expect(requestBody.get('profile')).toBeInstanceOf(Blob);
      expect(requestBody.get('skills')).toBeTruthy();
      expect(requestBody.get('favoriteGenres')).toBeTruthy();
      expect(requestBody.get('avatar')).toBeInstanceOf(File);
      expect(config.headers?.['Content-Type']).not.toBe('application/json');

      return [
        200,
        {
          status: 'success',
          error: null,
          message: '수정 성공',
          data: mockData,
        },
      ];
    });

    const result = await updateUserProfile('user-001', formData);

    expect(result.profile?.avatarUrl).toBe('https://example.com/avatar.jpg');
  });

  it('userId에 특수문자가 포함된 경우 안전하게 인코딩하여 PATCH 요청을 보낸다', async () => {
    const requestBody = { profile: { nickname: '특수문자수정' } };
    const mockData = {
      user: {
        id: 'user/001',
        email: 'test@example.com',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      profile: {
        nickname: '특수문자수정',
        selfDescription: null,
        profileMusic: null,
        avatarUrl: null,
      },
      skills: [],
      favoriteGenres: [],
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
    await expect(updateUserProfile('', requestBody)).rejects.toThrow(
      'userId is required',
    );
    await expect(updateUserProfile('   ', requestBody)).rejects.toThrow(
      'userId is required',
    );
  });
});

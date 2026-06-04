import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { Profile } from '@/entities/profile/model/types';
import type { UpdateProfileRequest } from '@/features/profile-update/api/profile-api';
import { API_URL } from '../config';

const mockProfiles: Record<string, Profile> = {
  'user-001': {
    user: {
      id: 'user-001',
      email: 'member@example.com',
      status: 'ACTIVE',
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    profile: {
      nickname: '김민준',
      selfDescription: '음악으로 세상과 소통하는 기타리스트',
      profileMusic: {
        externalTrackId: 'deezer-1',
        sourceType: 'DEEZER',
        title: '마치 흘러가는 바람처럼',
        artistName: 'DAY6(데이식스)',
        albumName: 'The Book of Us',
        albumImageUrl: null,
        durationMs: 202000,
        previewUrl: 'https://example.com/day6-preview.mp3',
        sourceUrl: 'https://www.deezer.com/track/demo-1',
      },
      avatarUrl:
        'https://previews.123rf.com/images/paylessimages/paylessimages1502/paylessimages150204116/46228198-band-instruments-such.jpg',
    },
    skills: [
      {
        skillTypeId: 'guitar-1',
        skillName: '일렉기타',
        level: 'ADVANCED',
        isPrimary: true,
      },
      {
        skillTypeId: 'acoustic-1',
        skillName: '통기타',
        level: 'INTERMEDIATE',
        isPrimary: false,
      },
      {
        skillTypeId: 'vocal-1',
        skillName: '보컬',
        level: 'BEGINNER',
        isPrimary: false,
      },
    ],
    favoriteGenres: [
      { genreId: 'genre-rock', name: 'Rock' },
      { genreId: 'genre-jpop', name: 'J-Pop' },
      { genreId: 'genre-blues', name: 'Blues' },
    ],
  },
  'user-002': {
    user: {
      id: 'user-002',
      email: 'other@example.com',
      status: 'ACTIVE',
      createdAt: '2026-02-02T00:00:00.000Z',
    },
    profile: {
      nickname: '홍길동',
      selfDescription: '합주 잼을 좋아하는 베이시스트',
      profileMusic: null,
      avatarUrl: null,
    },
    skills: [
      {
        skillTypeId: 'bass-1',
        skillName: '베이스',
        level: 'INTERMEDIATE',
        isPrimary: true,
      },
    ],
    favoriteGenres: [
      { genreId: 'genre-blues', name: 'Blues' },
      { genreId: 'genre-jazz', name: 'Jazz' },
    ],
  },
};

export const profileHandlers = [
  http.get(`${API_URL}/users/:userId/profiles`, ({ params }) => {
    const { userId } = params as { userId: string };
    const userProfile = mockProfiles[userId];

    if (!userProfile) {
      return HttpResponse.json(
        {
          message: '존재하지 않는 유저입니다.',
          error: 'Not Found',
          statusCode: 404,
        },
        { status: 404 },
      );
    }

    return HttpResponse.json<ApiResponse<Profile>>({
      success: true,
      data: userProfile,
    });
  }),

  http.patch(
    `${API_URL}/users/:userId/profiles`,
    async ({ params, request }) => {
      const { userId } = params as { userId: string };
      let body: UpdateProfileRequest;
      const contentType = request.headers.get('content-type') ?? '';

      if (contentType.includes('multipart/form-data')) {
        const formData = await request.formData();
        const profileValue = formData.get('profile');
        const parsedProfile =
          typeof profileValue === 'string'
            ? JSON.parse(profileValue)
            : profileValue instanceof Blob
              ? JSON.parse(await profileValue.text())
              : {};
        const avatar = formData.get('avatar');

        body = {
          profile: {
            ...parsedProfile,
            avatarUrl:
              avatar instanceof File
                ? URL.createObjectURL(avatar)
                : parsedProfile.avatarUrl,
          },
        };
      } else {
        body = (await request.json()) as UpdateProfileRequest;
      }

      if (!mockProfiles[userId]) {
        mockProfiles[userId] = {
          user: {
            id: userId,
            email: `${userId}@example.com`,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
          },
          profile: {
            nickname: `유저_${userId}`,
            selfDescription: null,
            profileMusic: null,
            avatarUrl: null,
          },
          skills: [],
          favoriteGenres: [],
        };
      }

      const current = mockProfiles[userId];

      if (body.profile) {
        current.profile = {
          nickname: body.profile.nickname ?? current.profile?.nickname ?? '',
          selfDescription:
            body.profile.selfDescription !== undefined
              ? body.profile.selfDescription
              : (current.profile?.selfDescription ?? null),
          profileMusic:
            body.profile.profileMusic !== undefined
              ? body.profile.profileMusic
              : (current.profile?.profileMusic ?? null),
          avatarUrl:
            body.profile.avatarUrl !== undefined
              ? body.profile.avatarUrl
              : (current.profile?.avatarUrl ?? null),
        };
      }

      if (body.personalInfo?.email) {
        current.user.email = body.personalInfo.email;
      }

      if (body.skills) {
        current.skills = body.skills.map((s) => ({
          skillTypeId: s.skillTypeId,
          skillName:
            s.skillTypeId === 'guitar-1'
              ? '일렉기타'
              : s.skillTypeId === 'acoustic-1'
                ? '통기타'
                : s.skillTypeId === 'vocal-1'
                  ? '보컬'
                  : '악기',
          level: s.level,
          isPrimary: s.isPrimary,
        }));
      }

      if (body.favoriteGenres) {
        current.favoriteGenres = body.favoriteGenres.map((genreId) => ({
          genreId,
          name: genreId.replace('genre-', ''),
        }));
      }

      return HttpResponse.json<ApiResponse<Profile>>({
        success: true,
        data: current,
      });
    },
  ),
];

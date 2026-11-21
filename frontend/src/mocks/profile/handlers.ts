import { http, HttpResponse } from 'msw';
import type { ApiSuccessResponse } from '@/shared/api';
import type { Profile } from '@/entities/profile/model/types';
import type { ProfileMusicPreview } from '@/entities/profile/api/profile-music-api';
import type { UpdateProfileRequest } from '@/features/profile-update/api/profile-api';
import { HANDLE_PATTERN } from '@/entities/user/model/schema';
import { API_URL } from '../config';
import { mockUsers } from '../user/handlers';

const HANDLE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

// 프로필 음악 검색(공용) mock — GET /users/profile-music/search
const profileMusicPreviews: ProfileMusicPreview[] = [
  {
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
  {
    externalTrackId: 'deezer-2',
    sourceType: 'DEEZER',
    title: '건널목',
    artistName: 'Whiteusedsocks',
    albumName: '건널목',
    albumImageUrl: null,
    durationMs: 211000,
    previewUrl: 'https://example.com/crosswalk-preview.mp3',
    sourceUrl: 'https://www.deezer.com/track/demo-2',
  },
];

const createHandleFailResponse = (message: string) =>
  HttpResponse.json(
    {
      status: 'fail',
      error: { code: 'BAD_REQUEST', details: { statusCode: 400 } },
      message,
      data: {},
    },
    { status: 400 },
  );

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
      handle: 'minsu_k',
      handleChangeableAt: null,
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
      // 고유 ID를 아직 정하지 않은 기존 유저
      handle: null,
      handleChangeableAt: null,
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

const findHandleOwner = (handle: string): string | null => {
  const target = handle.toLowerCase();
  const profileOwner = Object.values(mockProfiles).find(
    (p) => p.profile?.handle?.toLowerCase() === target,
  );
  if (profileOwner) return profileOwner.user.id;
  return mockUsers.find((u) => u.handle?.toLowerCase() === target)?.id ?? null;
};

export const profileHandlers = [
  http.get(`${API_URL}/users/profile-music/search`, ({ request }) => {
    const url = new URL(request.url);
    const query = (url.searchParams.get('q') ?? '').trim().toLowerCase();
    const items = query
      ? profileMusicPreviews.filter(
          (track) =>
            track.title.toLowerCase().includes(query) ||
            track.artistName.toLowerCase().includes(query),
        )
      : [];

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '프로필 음악 검색 성공',
      data: { items },
    });
  }),

  // 백엔드처럼 대소문자를 가리지 않고 겹침을 본다. 검색 mock 유저의 ID도 쓰는 중으로 친다.
  http.get(`${API_URL}/users/handles/availability`, ({ request }) => {
    const handle = new URL(request.url).searchParams.get('handle') ?? '';
    if (!HANDLE_PATTERN.test(handle)) {
      return createHandleFailResponse(
        '고유 ID는 영문 대소문자·숫자·언더바(_)만 사용해 4~8자로 입력해 주세요.',
      );
    }

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '고유 ID 확인 성공',
      data: { handle, available: !findHandleOwner(handle) },
    });
  }),

  http.patch(`${API_URL}/users/:userId/handle`, async ({ params, request }) => {
    const { userId } = params as { userId: string };
    const { handle } = (await request.json()) as { handle: string };
    const profile = mockProfiles[userId]?.profile;

    if (!profile) {
      return createHandleFailResponse('존재하지 않는 유저입니다.');
    }
    if (!HANDLE_PATTERN.test(handle)) {
      return createHandleFailResponse(
        '고유 ID는 영문 대소문자·숫자·언더바(_)만 사용해 4~8자로 입력해 주세요.',
      );
    }
    if (
      profile.handleChangeableAt &&
      new Date(profile.handleChangeableAt) > new Date()
    ) {
      return createHandleFailResponse(
        '고유 ID는 7일에 한 번만 변경할 수 있습니다.',
      );
    }
    const owner = findHandleOwner(handle);
    if (owner && owner !== userId) {
      return createHandleFailResponse('이미 사용 중인 고유 ID입니다.');
    }

    // 처음 설정은 7일 제한에 세지 않는다(백엔드 결정 6).
    const changedAt = profile.handle === null ? null : new Date();
    profile.handle = handle;
    profile.handleChangeableAt = changedAt
      ? new Date(changedAt.getTime() + HANDLE_COOLDOWN_MS).toISOString()
      : null;

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '고유 ID 변경 성공',
      data: {
        userId,
        handle,
        handleChangedAt: changedAt?.toISOString() ?? null,
        handleChangeableAt: profile.handleChangeableAt,
      },
    });
  }),

  http.get(`${API_URL}/users/:userId/profiles`, ({ params }) => {
    const { userId } = params as { userId: string };
    const userProfile = mockProfiles[userId];

    if (!userProfile) {
      return HttpResponse.json(
        {
          status: 'fail',
          error: { code: 'NOT_FOUND', details: { statusCode: 404 } },
          message: '존재하지 않는 유저입니다.',
          data: {},
        },
        { status: 404 },
      );
    }

    return HttpResponse.json<ApiSuccessResponse<Profile>>({
      status: 'success',
      error: null,
      message: '요청 성공',
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
            handle: null,
            handleChangeableAt: null,
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
          handle: current.profile?.handle ?? null,
          handleChangeableAt: current.profile?.handleChangeableAt ?? null,
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

      return HttpResponse.json<ApiSuccessResponse<Profile>>({
        status: 'success',
        error: null,
        message: '요청 성공',
        data: current,
      });
    },
  ),
];

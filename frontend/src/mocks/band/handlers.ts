import type { Band } from '@/entities/band/model/types';
import { http, HttpResponse } from 'msw';
import { API_URL } from '../config';
import type { CreateBandResponse } from '@/entities/band/model/schema';

const generatedTestBands: Band[] = Array.from({ length: 50 }, (_, index) => ({
  id: `test-band-uuid-${index + 1}`,
  name: `홍대 밴드 ${index + 1}`,
  description: `무한 스크롤 테스트용 밴드 ${index + 1} 설명입니다.`,
  visibility: true,
  inviteCode: `BAND${index + 1}`,
  myRole: 'MEMBER' as const,
  joinedAt: new Date(Date.now() - index * 86400000).toISOString(),
  createdAt: new Date(Date.now() - index * 86400000).toISOString(),
  memberCount: (index % 10) + 1,
}));

let mockBands: Band[] = [
  ...generatedTestBands,
  {
    id: 'a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1',
    name: '합주하자',
    description: '주 1회 합주',
    visibility: true,
    inviteCode: '7KQ2M9',
    myRole: 'BM',
    joinedAt: '2026-03-01T12:10:00.000+09:00',
    createdAt: '2026-03-01T12:00:00.000+09:00',
    memberCount: 10,
  },
  {
    id: 'e2f9a1c1-3d4b-4f2a-9d1f-8a7c1f2d3e4a',
    name: '락스타',
    description: null,
    visibility: true,
    inviteCode: 'P1Z8Q0',
    myRole: 'MEMBER',
    joinedAt: '2026-02-20T18:30:00.000+09:00',
    createdAt: '2026-02-10T09:00:00.000+09:00',
    memberCount: 4,
  },
  {
    id: 'c3d4e5f6-1a2b-4c3d-8e9f-0a1b2c3d4e5f',
    name: '재즈클럽',
    description: '매주 수요일 저녁 재즈 연습',
    visibility: true,
    inviteCode: 'J4Z7N2',
    myRole: 'MEMBER',
    joinedAt: '2026-01-15T19:00:00.000+09:00',
    createdAt: '2026-01-10T10:00:00.000+09:00',
    memberCount: 6,
  },
  {
    id: 'f7a8b9c0-2d3e-4f5a-9b0c-1d2e3f4a5b6c',
    name: '인디밴드 모여라',
    description: '인디 음악 좋아하는 사람들의 모임',
    visibility: false,
    inviteCode: 'I9N3D1',
    myRole: 'BM',
    joinedAt: '2026-02-01T14:00:00.000+09:00',
    createdAt: '2026-01-28T11:00:00.000+09:00',
    memberCount: 8,
  },
  {
    id: 'b1c2d3e4-5f6a-4b7c-8d9e-0f1a2b3c4d5e',
    name: '드럼서클',
    description: null,
    visibility: true,
    inviteCode: 'D5R8M0',
    myRole: 'MEMBER',
    joinedAt: '2026-03-10T10:30:00.000+09:00',
    createdAt: '2026-03-05T09:00:00.000+09:00',
    memberCount: 12,
  },
  {
    id: '6a7b8c9d-0e1f-4a2b-3c4d-5e6f7a8b9c0d',
    name: '어쿠스틱 감성',
    description: '어쿠스틱 기타와 보컬 중심 모임',
    visibility: true,
    inviteCode: 'A2K5S7',
    myRole: 'MEMBER',
    joinedAt: '2026-01-20T16:00:00.000+09:00',
    createdAt: '2026-01-05T13:00:00.000+09:00',
    memberCount: 5,
  },
  {
    id: '2c3d4e5f-6a7b-4c8d-9e0f-1a2b3c4d5e6f',
    name: '일렉기타 마스터',
    description: '일렉기타 연습 및 합주 그룹',
    visibility: false,
    inviteCode: 'E3L6C9',
    myRole: 'BM',
    joinedAt: '2026-02-14T18:00:00.000+09:00',
    createdAt: '2026-02-01T08:00:00.000+09:00',
    memberCount: 3,
  },
  {
    id: '8e9f0a1b-2c3d-4e5f-6a7b-8c9d0e1f2a3b',
    name: '피아노 트리오',
    description: '피아노, 베이스, 드럼 트리오 편성',
    visibility: true,
    inviteCode: 'P8T1R4',
    myRole: 'MEMBER',
    joinedAt: '2026-03-18T15:00:00.000+09:00',
    createdAt: '2026-03-15T12:00:00.000+09:00',
    memberCount: 3,
  },
  {
    id: '4f5a6b7c-8d9e-4f0a-1b2c-3d4e5f6a7b8c',
    name: '홍대 씬 크루',
    description: null,
    visibility: true,
    inviteCode: 'H6D9C2',
    myRole: 'MEMBER',
    joinedAt: '2026-01-30T20:00:00.000+09:00',
    createdAt: '2026-01-20T17:00:00.000+09:00',
    memberCount: 15,
  },
  {
    id: '0a1b2c3d-4e5f-4a6b-7c8d-9e0f1a2b3c4d',
    name: '베이스라인',
    description: '베이시스트들의 모임, 리듬이 생명',
    visibility: false,
    inviteCode: 'B3S5L8',
    myRole: 'BM',
    joinedAt: '2026-02-05T11:00:00.000+09:00',
    createdAt: '2026-01-25T09:30:00.000+09:00',
    memberCount: 7,
  },
  {
    id: '5b6c7d8e-9f0a-4b1c-2d3e-4f5a6b7c8d9e',
    name: '클래식 크로스오버',
    description: '클래식과 현대 음악의 경계를 넘다',
    visibility: true,
    inviteCode: 'C7R0X5',
    myRole: 'MEMBER',
    joinedAt: '2026-03-05T14:30:00.000+09:00',
    createdAt: '2026-02-20T10:00:00.000+09:00',
    memberCount: 9,
  },
  {
    id: '1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f',
    name: '펑크록 반란군',
    description: null,
    visibility: true,
    inviteCode: 'F4N8K1',
    myRole: 'MEMBER',
    joinedAt: '2026-01-10T21:00:00.000+09:00',
    createdAt: '2025-12-25T15:00:00.000+09:00',
    memberCount: 5,
  },
  {
    id: '7d8e9f0a-1b2c-4d3e-4f5a-6b7c8d9e0f1a',
    name: '신촌 버스킹 팀',
    description: '매주 토요일 신촌에서 버스킹',
    visibility: true,
    inviteCode: 'S2B6K3',
    myRole: 'BM',
    joinedAt: '2026-02-28T13:00:00.000+09:00',
    createdAt: '2026-02-15T11:00:00.000+09:00',
    memberCount: 6,
  },
  {
    id: '3e4f5a6b-7c8d-4e9f-0a1b-2c3d4e5f6a7b',
    name: '메탈헤즈',
    description: '헤비메탈과 데스메탈을 사랑하는 자들',
    visibility: false,
    inviteCode: 'M9T2L6',
    myRole: 'MEMBER',
    joinedAt: '2026-03-22T19:00:00.000+09:00',
    createdAt: '2026-03-20T16:00:00.000+09:00',
    memberCount: 5,
  },
  {
    id: '9f0a1b2c-3d4e-4f5a-6b7c-8d9e0f1a2b3c',
    name: 'R&B 소울메이트',
    description: 'R&B, 소울, 네오소울 커버 및 오리지널',
    visibility: true,
    inviteCode: 'R7B0S4',
    myRole: 'BM',
    joinedAt: '2026-01-25T17:30:00.000+09:00',
    createdAt: '2026-01-15T14:00:00.000+09:00',
    memberCount: 11,
  },
  {
    id: '5a6b7c8d-9e0f-4a1b-2c3d-4e5f6a7b8c9d',
    name: '작곡하는 사람들',
    description: null,
    visibility: false,
    inviteCode: 'W5R3T9',
    myRole: 'MEMBER',
    joinedAt: '2026-02-10T10:00:00.000+09:00',
    createdAt: '2026-02-01T09:00:00.000+09:00',
    memberCount: 13,
  },
  {
    id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    name: '보컬 하모니',
    description: '4파트 하모니를 맞추는 아카펠라 팀',
    visibility: true,
    inviteCode: 'V1H4M7',
    myRole: 'MEMBER',
    joinedAt: '2026-03-12T16:00:00.000+09:00',
    createdAt: '2026-03-01T10:00:00.000+09:00',
    memberCount: 8,
  },
  {
    id: '8d9e0f1a-2b3c-4d5e-6f7a-8b9c0d1e2f3a',
    name: '일렉트로닉 콜렉티브',
    description: 'EDM, 신스팝, 일렉트로니카 제작 모임',
    visibility: true,
    inviteCode: 'E0C8V3',
    myRole: 'BM',
    joinedAt: '2026-01-05T20:00:00.000+09:00',
    createdAt: '2025-12-15T12:00:00.000+09:00',
    memberCount: 7,
  },
  {
    id: '4e5f6a7b-8c9d-4e0f-1a2b-3c4d5e6f7a8b',
    name: '트로트 모임',
    description: '트로트 커버 및 공연 준비 그룹',
    visibility: true,
    inviteCode: 'T6R1T5',
    myRole: 'MEMBER',
    joinedAt: '2026-02-18T15:00:00.000+09:00',
    createdAt: '2026-02-05T11:00:00.000+09:00',
    memberCount: 20,
  },
  {
    id: 'a0b1c2d3-e4f5-4a6b-7c8d-9e0f1a2b3c4d',
    name: '재즈 임프로비전',
    description: null,
    visibility: false,
    inviteCode: 'J2I5V8',
    myRole: 'BM',
    joinedAt: '2026-03-25T18:00:00.000+09:00',
    createdAt: '2026-03-20T14:00:00.000+09:00',
    memberCount: 6,
  },
];

// 밴드 커버는 Band 목록 타입에 없어 mock에서만 따로 기억한다(수정 후 재조회 확인용).
const mockCoverImgUrls = new Map<string, string | null>();

export const bandHandlers = [
  // 밴드 목록 조회 Mock
  http.get(`${API_URL}/bands`, () => {
    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '내 밴드 목록 조회 성공',
      data: {
        totalCount: mockBands.length,
        items: mockBands,
      },
    });
  }),

  // 내 가입 밴드 목록 조회 Mock
  http.get(`${API_URL}/bands/me`, () => {
    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '내 가입 밴드 목록 조회 성공',
      data: {
        totalCount: mockBands.length,
        items: mockBands,
      },
    });
  }),

  // 밴드 검색 Mock (GET /bands/search)
  // '/bands/me' 및 '/bands/:bandId'보다 위에 선언
  http.get(`${API_URL}/bands/search`, ({ request }) => {
    const url = new URL(request.url);
    const keyword = url.searchParams.get('where__name__contain') || '';
    const take = Number(url.searchParams.get('take') || 20);
    const cursorId = url.searchParams.get('cursor__id');

    const filtered = mockBands.filter(
      (b) =>
        b.visibility &&
        (b.name.toLowerCase().includes(keyword.toLowerCase()) ||
          (b.description &&
            b.description.toLowerCase().includes(keyword.toLowerCase()))),
    );

    let startIndex = 0;
    if (cursorId) {
      const foundIndex = filtered.findIndex((b) => b.id === cursorId);
      if (foundIndex !== -1) {
        startIndex = foundIndex + 1;
      }
    }

    const sliced = filtered.slice(startIndex, startIndex + take);
    const hasMore = startIndex + take < filtered.length;

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '밴드 검색 완료',
      data: {
        items: sliced.map((band) => ({
          ...band,
          bandId: band.id,
          bandMaster: {
            userId: '11111111-1111-1111-1111-111111111111',
            nickname: '밴드마스터',
          },
          coverImgUrl: null,
          bandMasterUserId: '11111111-1111-1111-1111-111111111111',
          genres: [
            { id: 'genre-rock', name: '록' },
            { id: 'genre-indie', name: '인디' },
          ],
        })),
        meta: {
          count: sliced.length,
          take,
          cursor:
            hasMore && sliced.length > 0
              ? {
                  id: sliced[sliced.length - 1].id,
                  createdAt: sliced[sliced.length - 1].createdAt,
                }
              : null,
          next: null,
        },
      },
    });
  }),

  // 밴드 초대 링크 발급·재발급 Mock (POST /bands/:bandId/invite-link)
  // ':bandId' 핸들러보다 앞에 둬야 하위 경로가 가로채이지 않는다.
  http.post(`${API_URL}/bands/:bandId/invite-link`, ({ params }) => {
    const { bandId } = params as { bandId: string };
    const found = mockBands.find((band) => band.id === bandId) ?? mockBands[0];
    // 서버는 매 발급마다 새 코드를 만들고 이전 코드를 무효화한다.
    const inviteCode = `${found.inviteCode ?? 'BANDCO01'}${Date.now().toString(36).toUpperCase().slice(-4)}`;

    return HttpResponse.json(
      {
        status: 'success',
        error: null,
        message: '밴드 초대 링크를 발급했습니다.',
        data: {
          bandId,
          inviteCode,
          expiredAt: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      },
      { status: 201 },
    );
  }),

  // 밴드 초대 링크 폐기 Mock (DELETE /bands/:bandId/invite-link)
  http.delete(`${API_URL}/bands/:bandId/invite-link`, ({ params }) => {
    const { bandId } = params as { bandId: string };

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '밴드 초대 링크를 폐기했습니다.',
      data: { bandId, revokedAt: new Date().toISOString() },
    });
  }),

  // 초대 코드로 밴드 가입 Mock (POST /invite-links/:code/join)
  http.post(`${API_URL}/invite-links/:code/join`, () => {
    return HttpResponse.json(
      {
        status: 'success',
        error: null,
        message: '밴드에 가입했습니다.',
        data: {
          bandId: mockBands[0].id,
          userId: 'user-001',
          memberId: 'band-member-1',
          joinedAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  }),

  // 밴드 정보 수정 Mock (PATCH /bands/:bandId)
  http.patch(`${API_URL}/bands/:bandId`, async ({ params, request }) => {
    const { bandId } = params as { bandId: string };
    const body = (await request.json()) as {
      name?: string;
      description?: string | null;
      visibility?: boolean;
      coverImgUrl?: string | null;
    };
    const index = mockBands.findIndex((band) => band.id === bandId);
    const target = index >= 0 ? mockBands[index] : mockBands[0];
    const updated = {
      ...target,
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.description !== undefined
        ? { description: body.description }
        : {}),
      ...(body.visibility !== undefined ? { visibility: body.visibility } : {}),
    };
    if (index >= 0) mockBands[index] = updated;
    if (body.coverImgUrl !== undefined)
      mockCoverImgUrls.set(bandId, body.coverImgUrl);

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '밴드 정보 수정 성공',
      // 백엔드 UpdateBandResult는 감싸지 않은 평평한 객체이고 id 대신 bandId를 준다.
      data: {
        bandId: updated.id,
        name: updated.name,
        description: updated.description,
        visibility: updated.visibility,
        coverImgUrl: mockCoverImgUrls.get(bandId) ?? null,
        updatedAt: new Date().toISOString(),
      },
    });
  }),

  // 밴드 나가기 Mock (DELETE /bands/:bandId/me)
  http.delete(`${API_URL}/bands/:bandId/me`, ({ params }) => {
    const { bandId } = params as { bandId: string };
    mockBands = mockBands.filter((band) => band.id !== bandId);

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '밴드 나가기 완료',
      data: { bandId },
    });
  }),

  // 밴드 상세 조회 Mock (GET /bands/:bandId)
  // '/bands/me' 뒤에 둬야 :bandId가 me를 가로채지 않는다.
  http.get(`${API_URL}/bands/:bandId`, ({ params }) => {
    const { bandId } = params as { bandId: string };
    const found = mockBands.find((band) => band.id === bandId) ?? mockBands[0];

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '밴드 상세 조회 성공',
      data: {
        band: {
          id: found.id,
          name: found.name,
          description: found.description,
          visibility: found.visibility,
          coverImgUrl: mockCoverImgUrls.get(bandId) ?? null,
          bandMasterUserId: '11111111-1111-1111-1111-111111111111',
          genres: [
            { id: 'genre-rock', name: '록' },
            { id: 'genre-indie', name: '인디' },
          ],
          memberCount: found.memberCount ?? 0,
          createdAt: found.createdAt,
        },
      },
    });
  }),

  // 밴드 생성 Mock
  http.post(`${API_URL}/bands`, async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      description: string | null;
      visibility: boolean;
      genreIds?: string[];
      coverImgUrl?: string | null;
      inviteeUserIds?: string[];
    };

    // 단순 딜레이 시뮬레이션
    await new Promise((resolve) => setTimeout(resolve, 300));

    // 1. "네트워크 에러" 시뮬레이션
    if (body.name === '네트워크 에러') {
      return HttpResponse.error();
    }

    // 2. "서버 에러" 시뮬레이션
    if (body.name === '서버 에러') {
      return HttpResponse.json(
        {
          status: 'error',
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '서버 내부 오류가 발생했습니다.',
          },
          message: '서버 에러 발생',
          data: null,
        },
        { status: 500 },
      );
    }

    // 3. "중복 에러" 시뮬레이션
    if (body.name === '중복 에러') {
      return HttpResponse.json(
        {
          status: 'error',
          error: {
            code: 'DUPLICATE_BAND_NAME',
            message: '이미 존재하는 밴드 이름입니다.',
          },
          message: '중복된 밴드명 에러 발생',
          data: null,
        },
        { status: 409 },
      );
    }

    const newBandId = `band-${Date.now()}`;
    const nowStr = new Date().toISOString();

    // 1. GET 목록조회 스키마(Band)에 맞추어 mockBands에 추가할 객체 생성
    const newBand: CreateBandResponse & Band = {
      id: newBandId,
      name: body.name,
      description: body.description,
      visibility: body.visibility,
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      bandMasterUserId: '11111111-1111-1111-1111-111111111111',
      createdAt: nowStr,
      joinedAt: nowStr,
      myRole: 'BM',
      memberCount: 1,
    };

    // 2. 인메모리 리스트 맨 앞에 추가
    mockBands = [newBand, ...mockBands];

    // 3. 백엔드 실제 응답 규격({ data: { band: ... } }) 반환
    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '밴드 생성 성공',
      data: {
        band: {
          id: newBandId,
          name: body.name,
          description: body.description,
          visibility: body.visibility,
          coverImgUrl: body.coverImgUrl ?? null,
          genres: (
            body.genreIds ?? ['0f0a4e3a-8a0c-4f6e-9d2d-9c1a8c6b7b1a']
          ).map((id) => ({
            id,
            name: 'rock',
          })),
          bandMasterUserId: '11111111-1111-1111-1111-111111111111',
          createdAt: nowStr,
          invitations: {
            success: (body.inviteeUserIds ?? []).map((userId) => ({
              userId,
              invitationId: `invite-${userId}`,
            })),
            failed: [],
          },
        },
      },
    });
  }),
];

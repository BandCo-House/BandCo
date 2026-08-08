import { http, HttpResponse } from 'msw';
import {
  type CreateScheduleRequest,
  type CreateScheduleResult,
  type ScheduleDetail,
  type ScheduleItem,
  type ScheduleParticipantDetail,
  type ScheduleParticipantPreview,
  type ScheduleSong,
} from '@/entities/schedule/model/types';
import type { ApiResponse } from '@/shared/api';
import { BAND_MEMBERS, MEMBER_GEAR } from '../member/handlers';
import { API_URL } from '../config';

// Figma MCP 자산 URL은 인증 세션에 묶여 커밋 mock에 부적합해, 자체 완결된 data URL로 둔다.
const AVATAR =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23bcbcbc'/%3E%3C/svg%3E";

const MAX_PREVIEW = 4;

/**
 * 참가자 미리보기(앞쪽 일부)를 만든다. withNull이면 일부는 프로필 이미지가 없어
 * 검정 배경 + 흰 글자(B/이니셜) 폴백을 확인할 수 있다.
 */
const makeParticipants = (
  count: number,
  options: { withNull?: boolean } = {},
): ScheduleParticipantPreview[] =>
  Array.from({ length: Math.min(count, MAX_PREVIEW) }, (_, i) => ({
    bandMemberId: `member-${i + 1}`,
    nickname: `멤버${i + 1}`,
    profileImageUrl: options.withNull && i % 2 === 1 ? null : AVATAR,
  }));

// 오늘 날짜 기준으로 시간만 고정해 단일 일 타임라인을 확인하기 쉽게 둔다.
const atOffsetDay = (offsetDay: number, hour: number, minute = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDay);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};

interface ScheduleSeed {
  id: string;
  type: ScheduleItem['scheduleType'];
  title: string;
  start: [number, number?];
  end: [number, number?];
  /** 종료가 다음 날이면 true(자정 넘김 확인용). */
  endNextDay?: boolean;
  place: string | null;
  participantCount: number;
  isMine: boolean;
  withNull?: boolean;
}

// 가로 스크롤(3개 겹침)·빈 프사·5분 일정·다인원(+N)·새벽 wrap·단독/겹침을 골고루 섞었다.
const SEEDS: ScheduleSeed[] = [
  // 06시 경계를 가로지르는 일정(05:00~08:00) → 06:00~08:00로 잘려 상단에 표시.
  {
    id: 'sch-0',
    type: 'PRACTICE',
    title: '아침 리허설',
    start: [5],
    end: [8],
    place: '신촌 연습실 A',
    participantCount: 4,
    isMine: true,
  },
  // 09:00~10:30대에 3개가 겹쳐 가로 스크롤을 유발한다.
  {
    id: 'sch-1',
    type: 'PRACTICE',
    title: '합주 A',
    start: [9],
    end: [11],
    place: '신촌 연습실 A',
    participantCount: 6,
    isMine: true,
  },
  {
    id: 'sch-2',
    type: 'MEETING',
    title: '의상 회의',
    start: [9],
    end: [11],
    place: '신촌 연습실 B',
    participantCount: 6,
    isMine: false,
  },
  {
    id: 'sch-3',
    type: 'PRACTICE',
    title: '보컬 연습',
    start: [9, 30],
    end: [10, 30],
    place: '신촌 연습실 C',
    participantCount: 3,
    isMine: true,
    withNull: true,
  },
  // 단독(전체 폭) + 8명(+4)
  {
    id: 'sch-4',
    type: 'PRACTICE',
    title: '합주 B',
    start: [11],
    end: [13],
    place: '신촌 연습실 A',
    participantCount: 8,
    isMine: false,
  },
  // 5분 일정(끝 트림 확인)
  {
    id: 'sch-5',
    type: 'MEETING',
    title: '점심 정산',
    start: [13],
    end: [13, 5],
    place: '회의실',
    participantCount: 2,
    isMine: true,
  },
  // 12명(+8) + 겹침 2개
  {
    id: 'sch-6',
    type: 'MEETING',
    title: '전체 회의',
    start: [14],
    end: [15, 30],
    place: '대강당',
    participantCount: 12,
    isMine: true,
    withNull: true,
  },
  {
    id: 'sch-7',
    type: 'PRACTICE',
    title: '사운드 체크',
    start: [14, 30],
    end: [16],
    place: '무대',
    participantCount: 4,
    isMine: false,
  },
  // 혼자(나만, +N 없음) + 빈 프사
  {
    id: 'sch-8',
    type: 'PRACTICE',
    title: '개인 연습',
    start: [20],
    end: [21, 30],
    place: '신촌 연습실 A',
    participantCount: 1,
    isMine: true,
    withNull: true,
  },
  // 자정을 넘겨 다음 날 새벽까지 이어지는 일정(하단으로 연결되는지 확인)
  {
    id: 'sch-9',
    type: 'MEETING',
    title: '뒤풀이 회의',
    start: [22],
    end: [1, 30],
    endNextDay: true,
    place: '펜션',
    participantCount: 9,
    isMine: false,
  },
  // 새벽(06시 이전) → 타임라인 하단으로 wrap
  {
    id: 'sch-10',
    type: 'PRACTICE',
    title: '새벽 합주',
    start: [2],
    end: [4],
    place: '신촌 연습실 D',
    participantCount: 5,
    isMine: true,
  },
  // 참가자 0명(아바타 영역 없음)
  {
    id: 'sch-11',
    type: 'MEETING',
    title: '온라인 정산',
    start: [0, 30],
    end: [1],
    place: null,
    participantCount: 0,
    isMine: false,
  },
];

// 밴드 곡/장소 목업(song·place handlers)과 같은 id로 순환 배정해 상세 필터가 동작하게 한다.
const BAND_PLACES = [
  { placeId: 'place-1', name: '신촌 연습실 A' },
  { placeId: 'place-2', name: '합정 사운드룸' },
  { placeId: 'place-3', name: '홍대 드럼스튜디오' },
  { placeId: 'place-4', name: '강남 밴드연습실' },
  { placeId: 'place-5', name: '이태원 자유합주실' },
];

const BAND_SONGS = [
  { songId: 'band-song-1', title: '좋은 날', artistName: '아이유' },
  { songId: 'band-song-2', title: '봄날', artistName: '방탄소년단' },
  { songId: 'band-song-3', title: 'Dynamite', artistName: '방탄소년단' },
  { songId: 'band-song-4', title: '밤편지', artistName: '아이유' },
  { songId: 'band-song-5', title: '건널목', artistName: 'Whiteusedsocks' },
  { songId: 'band-song-6', title: 'Attention', artistName: '뉴진스' },
];

// team/handlers.ts의 팀과 teamId를 맞춰 상세 필터의 "연습 팀" 선택이 실제로 걸리게 한다.
const BAND_TEAMS = [
  { teamId: 'team-1', name: '듀얼 기타' },
  { teamId: 'team-2', name: '듀얼 보컬' },
  { teamId: 'team-3', name: '리듬 세션' },
];

const buildSchedules = (): ScheduleItem[] =>
  SEEDS.map((seed, index) => ({
    scheduleId: seed.id,
    spaceId: 'space-1',
    scheduleType: seed.type,
    title: seed.title,
    startAt: atOffsetDay(0, seed.start[0], seed.start[1]),
    endAt: atOffsetDay(seed.endNextDay ? 1 : 0, seed.end[0], seed.end[1]),
    // place=null 시드는 장소 없음 유지, 나머지는 밴드 장소를 순환 배정.
    place: seed.place === null ? null : BAND_PLACES[index % BAND_PLACES.length],
    // 합주(PRACTICE)에만 팀·곡을 순환 배정(회의는 team/songs 없음).
    team:
      seed.type === 'PRACTICE' ? BAND_TEAMS[index % BAND_TEAMS.length] : null,
    songs:
      seed.type === 'PRACTICE' ? [BAND_SONGS[index % BAND_SONGS.length]] : [],
    participantCount: seed.participantCount,
    participants: makeParticipants(seed.participantCount, {
      withNull: seed.withNull,
    }),
    isMine: seed.isMine,
    memo: null,
    status: 'PLANNED',
  }));

const placesById = new Map(BAND_PLACES.map((p) => [p.placeId, p]));
const songsById = new Map(BAND_SONGS.map((s) => [s.songId, s]));
const membersById = new Map(BAND_MEMBERS.map((m) => [m.bandMemberId, m]));

// 생성/수정한 일정을 상세로 되돌려주기 위한 인메모리 스토어(세션 한정).
const scheduleStore = new Map<string, ScheduleDetail>();

/** 테스트 간 생성/수정 일정이 새지 않도록 스토어를 비운다(test setup afterEach에서 호출). */
export const resetScheduleStore = () => scheduleStore.clear();

const buildParticipants = (
  ids: string[] = [],
  scheduleId: string,
): ScheduleParticipantDetail[] =>
  ids.map((mid, index) => {
    const member = membersById.get(mid);
    return {
      participantId: `${scheduleId}-p${index + 1}`,
      bandMemberId: mid,
      userId: member?.userId ?? mid,
      nickname: member?.nickname ?? '멤버',
      avatarUrl: member?.avatarUrl ?? null,
      attendanceStatus: null,
      note: MEMBER_GEAR[mid] ?? null,
    };
  });

const resolveSongs = (ids: string[] = []): ScheduleSong[] =>
  ids
    .map((id) => songsById.get(id))
    .filter((song): song is ScheduleSong => Boolean(song));

const buildDetail = (
  scheduleId: string,
  spaceId: string,
  body: CreateScheduleRequest,
): ScheduleDetail => {
  const now = new Date().toISOString();
  const place = body.placeId ? placesById.get(body.placeId) : undefined;
  return {
    scheduleId,
    spaceId,
    scheduleType: body.scheduleType,
    title: body.title,
    startAt: body.startAt,
    endAt: body.endAt,
    status: body.status,
    place: place ? { ...place, address: '' } : null,
    songs: resolveSongs(body.songIds),
    participants: buildParticipants(body.participantBandMemberIds, scheduleId),
    memo: body.memo ?? null,
    createdByBandMemberId: 'member-1',
    isMine: true,
    createdAt: now,
    updatedAt: now,
  };
};

// 스토어에 없는(=시드) 일정 상세를 목록 시드에서 만들어 준다.
const buildFallbackDetail = (scheduleId: string): ScheduleDetail => {
  const now = new Date().toISOString();
  const item = buildSchedules().find((s) => s.scheduleId === scheduleId);
  if (!item) {
    return {
      scheduleId,
      spaceId: 'space-1',
      scheduleType: 'MEETING',
      title: '일정',
      startAt: now,
      endAt: now,
      status: 'PLANNED',
      place: null,
      songs: [],
      participants: [],
      memo: null,
      createdByBandMemberId: 'member-1',
      isMine: true,
      createdAt: now,
      updatedAt: now,
    };
  }
  const participantIds = BAND_MEMBERS.slice(0, item.participantCount).map(
    (m) => m.bandMemberId,
  );
  return {
    scheduleId,
    spaceId: item.spaceId,
    scheduleType: item.scheduleType,
    title: item.title,
    startAt: item.startAt,
    endAt: item.endAt,
    status: item.status,
    place: item.place ? { ...item.place, address: '' } : null,
    songs: item.songs,
    participants: buildParticipants(participantIds, scheduleId),
    memo: item.memo,
    createdByBandMemberId: 'member-1',
    isMine: item.isMine ?? true,
    createdAt: now,
    updatedAt: now,
  };
};

const toResult = (detail: ScheduleDetail): CreateScheduleResult => ({
  scheduleId: detail.scheduleId,
  spaceId: detail.spaceId,
  scheduleType: detail.scheduleType,
  title: detail.title,
  startAt: detail.startAt,
  endAt: detail.endAt,
  status: detail.status,
  placeId: detail.place?.placeId ?? null,
  songs: detail.songs,
  participantCount: detail.participants.length,
  teamId: null,
  memo: detail.memo,
  createdAt: detail.createdAt,
});

export const scheduleHandlers = [
  http.get(`${API_URL}/bandspaces/:spaceId/schedules`, ({ request }) => {
    const url = new URL(request.url);
    const from = url.searchParams.get('where__start_at__greater_than_equal');
    const to = url.searchParams.get('where__start_at__less_than_equal');
    const scheduleType = url.searchParams.get('where__schedule_type');

    const items = buildSchedules().filter((item) => {
      if (scheduleType && item.scheduleType !== scheduleType) return false;
      if (from && item.startAt < from) return false;
      if (to && item.startAt > to) return false;
      return true;
    });

    return HttpResponse.json({
      success: true,
      data: {
        items,
        meta: { count: items.length, take: 50, cursor: null, next: null },
      },
    });
  }),

  // 일정 생성 (POST /bandspaces/:spaceId/schedules)
  http.post(
    `${API_URL}/bandspaces/:spaceId/schedules`,
    async ({ params, request }) => {
      const { spaceId } = params as { spaceId: string };
      const body = (await request.json()) as CreateScheduleRequest;
      const scheduleId = `sch-created-${Date.now()}`;
      const detail = buildDetail(scheduleId, spaceId, body);
      scheduleStore.set(scheduleId, detail);

      return HttpResponse.json<ApiResponse<CreateScheduleResult>>({
        success: true,
        data: toResult(detail),
      });
    },
  ),

  // 일정 상세 (GET /schedules/:scheduleId)
  http.get(`${API_URL}/schedules/:scheduleId`, ({ params }) => {
    const { scheduleId } = params as { scheduleId: string };
    const detail =
      scheduleStore.get(scheduleId) ?? buildFallbackDetail(scheduleId);

    return HttpResponse.json<ApiResponse<{ schedule: ScheduleDetail }>>({
      success: true,
      data: { schedule: detail },
    });
  }),

  // 일정 수정 (PATCH /schedules/:scheduleId)
  http.patch(
    `${API_URL}/schedules/:scheduleId`,
    async ({ params, request }) => {
      const { scheduleId } = params as { scheduleId: string };
      const body = (await request.json()) as Partial<CreateScheduleRequest>;
      const existing =
        scheduleStore.get(scheduleId) ?? buildFallbackDetail(scheduleId);
      const place = body.placeId ? placesById.get(body.placeId) : undefined;

      const updated: ScheduleDetail = {
        ...existing,
        title: body.title ?? existing.title,
        scheduleType: body.scheduleType ?? existing.scheduleType,
        startAt: body.startAt ?? existing.startAt,
        endAt: body.endAt ?? existing.endAt,
        status: body.status ?? existing.status,
        place:
          body.placeId !== undefined
            ? place
              ? { ...place, address: '' }
              : null
            : existing.place,
        songs:
          body.songIds !== undefined
            ? resolveSongs(body.songIds)
            : existing.songs,
        participants:
          body.participantBandMemberIds !== undefined
            ? buildParticipants(body.participantBandMemberIds, scheduleId)
            : existing.participants,
        memo: body.memo !== undefined ? (body.memo ?? null) : existing.memo,
        updatedAt: new Date().toISOString(),
      };
      scheduleStore.set(scheduleId, updated);

      return HttpResponse.json<ApiResponse<CreateScheduleResult>>({
        success: true,
        data: toResult(updated),
      });
    },
  ),
];

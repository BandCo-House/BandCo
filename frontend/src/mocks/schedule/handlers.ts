import { http, HttpResponse } from 'msw';
import {
  type ScheduleItem,
  type ScheduleParticipantPreview,
} from '@/entities/schedule/model/types';
import { API_URL } from '../config';

const AVATAR =
  'https://www.figma.com/api/mcp/asset/e0d7fd40-4d78-4dd1-83de-f619c2d803a9';

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
    // 합주(PRACTICE)에만 밴드 곡을 순환 배정.
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
];

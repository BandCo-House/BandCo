import { http, HttpResponse } from 'msw';
import { type ScheduleItem } from '@/entities/schedule/model/types';
import { API_URL } from '../config';

const schedules: ScheduleItem[] = [
  // 1. 자정 넘김 + 연결성 테스트
  {
    scheduleId: '1',
    spaceId: 'space-1',
    scheduleType: 'PRACTICE',
    title: '좋은 날 합주',
    startAt: '2026-03-17T22:00:00',
    endAt: '2026-03-18T00:00:00',
    place: { name: '연습실 A' },
    practice: {
      title: '좋은 날',
      artistName: 'IU',
      team: { name: '듀엣 기타 편성' },
    },
    meeting: null,
    ui: {
      cardTitle: '좋은 날',
      cardSubTitle: '2026-03-17',
      colorToken: 'gray-500',
    },
    status: 'SCHEDULED',
  },
  // 2. 동일 시간 완전 겹침 (17일 14:00 ~ 16:00)
  {
    scheduleId: 'overlap-1',
    spaceId: 'space-1',
    scheduleType: 'MEETING',
    title: '기획 회의 A',
    startAt: '2026-03-17T14:00:00',
    endAt: '2026-03-17T16:00:00',
    place: { name: '회의실 1' },
    practice: null,
    meeting: { participantCount: 3 },
    ui: {
      cardTitle: '기획 회의 A',
      cardSubTitle: '회의',
      colorToken: 'blue-400',
    },
    status: 'SCHEDULED',
  },
  {
    scheduleId: 'overlap-2',
    spaceId: 'space-1',
    scheduleType: 'MEETING',
    title: '디자인 리뷰',
    startAt: '2026-03-17T14:00:00',
    endAt: '2026-03-17T16:00:00',
    place: { name: '회의실 2' },
    practice: null,
    meeting: { participantCount: 4 },
    ui: {
      cardTitle: '디자인 리뷰',
      cardSubTitle: '리뷰',
      colorToken: 'pink-400',
    },
    status: 'SCHEDULED',
  },
  // 3. 계단식 겹침 (18일 10:00 ~ 12:00, 11:00 ~ 13:00, 12:00 ~ 14:00)
  {
    scheduleId: 'cascade-1',
    spaceId: 'space-1',
    scheduleType: 'PRACTICE',
    title: '파트 연습 1',
    startAt: '2026-03-18T10:00:00',
    endAt: '2026-03-18T12:00:00',
    place: { name: '연습실 B' },
    practice: { title: '연습 1', artistName: 'A', team: { name: '팀 A' } },
    meeting: null,
    ui: {
      cardTitle: '파트 연습 1',
      cardSubTitle: '연습',
      colorToken: 'green-400',
    },
    status: 'SCHEDULED',
  },
  {
    scheduleId: 'cascade-2',
    spaceId: 'space-1',
    scheduleType: 'PRACTICE',
    title: '파트 연습 2',
    startAt: '2026-03-18T11:00:00',
    endAt: '2026-03-18T13:00:00',
    place: { name: '연습실 C' },
    practice: { title: '연습 2', artistName: 'B', team: { name: '팀 B' } },
    meeting: null,
    ui: {
      cardTitle: '파트 연습 2',
      cardSubTitle: '연습',
      colorToken: 'yellow-400',
    },
    status: 'SCHEDULED',
  },
  {
    scheduleId: 'cascade-3',
    spaceId: 'space-1',
    scheduleType: 'PRACTICE',
    title: '파트 연습 3',
    startAt: '2026-03-18T12:00:00',
    endAt: '2026-03-18T14:00:00',
    place: { name: '연습실 D' },
    practice: { title: '연습 3', artistName: 'C', team: { name: '팀 C' } },
    meeting: null,
    ui: {
      cardTitle: '파트 연습 3',
      cardSubTitle: '연습',
      colorToken: 'orange-400',
    },
    status: 'SCHEDULED',
  },
  // 4. 부분 겹침 (19일 긴 일정 사이에 짧은 일정)
  {
    scheduleId: 'partial-1',
    spaceId: 'space-1',
    scheduleType: 'MEETING',
    title: '종일 워크숍',
    startAt: '2026-03-19T09:00:00',
    endAt: '2026-03-19T18:00:00',
    place: { name: '대강당' },
    practice: null,
    meeting: { participantCount: 20 },
    ui: { cardTitle: '워크숍', cardSubTitle: '종일', colorToken: 'indigo-500' },
    status: 'SCHEDULED',
  },
  {
    scheduleId: 'partial-2',
    spaceId: 'space-1',
    scheduleType: 'MEETING',
    title: '중간 점검',
    startAt: '2026-03-19T13:30:00',
    endAt: '2026-03-19T14:15:00', // 45분간
    place: { name: '소회의실' },
    practice: null,
    meeting: { participantCount: 3 },
    ui: { cardTitle: '점검', cardSubTitle: '짧은', colorToken: 'red-400' },
    status: 'SCHEDULED',
  },
  // 5. 다일 일정 (20일 ~ 22일)
  {
    scheduleId: '3',
    spaceId: 'space-1',
    scheduleType: 'PRACTICE',
    title: '다일 합주 캠프',
    startAt: '2026-03-20T10:00:00',
    endAt: '2026-03-22T18:00:00',
    place: { name: '강원도 펜션' },
    practice: {
      title: '합주 캠프',
      artistName: 'Various',
      team: { name: '전체 밴드' },
    },
    meeting: null,
    ui: {
      cardTitle: '합주 캠프',
      cardSubTitle: '캠프',
      colorToken: 'blue-500',
    },
    status: 'SCHEDULED',
  },
];

export const scheduleHandlers = [
  http.get(`${API_URL}/spaces/:spaceId/schedules`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: schedules,
      },
    });
  }),
];

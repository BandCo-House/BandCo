import { http, HttpResponse } from 'msw';
import { GetSchedulesResponse, ScheduleItem } from '@/entities/schedule/model/types';
import { API_URL } from '../config';

const schedules: ScheduleItem[] = [
  {
    scheduleId: '1',
    spaceId: 'space-1',
    scheduleType: 'PRACTICE',
    title: '좋은 날 합주',
    startAt: '2026-03-17T22:00:00',
    endAt: '2026-03-18T02:00:00', // 자정 넘김
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
  {
    scheduleId: '2',
    spaceId: 'space-1',
    scheduleType: 'MEETING',
    title: '공연 전 최종 회의',
    startAt: '2026-03-19T14:00:00',
    endAt: '2026-03-19T16:00:00',
    place: { name: '스터디룸 B' },
    practice: null,
    meeting: { participantCount: 5 },
    ui: {
      cardTitle: '운영 회의',
      cardSubTitle: '2026-03-19',
      colorToken: 'gray-400',
    },
    status: 'SCHEDULED',
  },
  {
    scheduleId: '3',
    spaceId: 'space-1',
    scheduleType: 'PRACTICE',
    title: '다일 합주 캠프',
    startAt: '2026-03-20T10:00:00',
    endAt: '2026-03-22T18:00:00', // 여러 날에 걸침
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
  }
];

export const scheduleHandlers = [
  http.get(`${API_URL}/spaces/:spaceId/schedules`, () => {
    return HttpResponse.json({
      success: true,
      data: {
        items: schedules,
      }
    });
  }),
];

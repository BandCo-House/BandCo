import { http, HttpResponse } from 'msw';
import type { ApiSuccessResponse } from '@/shared/api';
import type { ActiveAnnouncement } from '@/entities/announcement/model/schema';
import { API_URL } from '../config';

const activeAnnouncements: ActiveAnnouncement[] = [
  {
    announcementId: '7a1f4c2e-5b6d-4e8f-9a0b-1c2d3e4f5a6b',
    title: '10월 10일 새벽 정기 점검 안내',
    content:
      '더 안정적인 서비스를 위해 정기 점검을 진행합니다.\n\n일시: 10월 10일(금) 02:00 ~ 04:00\n점검 중에는 BandCo를 이용할 수 없어요.',
    startsAt: null,
    endsAt: '2026-10-10T19:00:00.000Z',
  },
];

export const announcementHandlers = [
  http.get(`${API_URL}/announcements/active`, () =>
    HttpResponse.json<
      ApiSuccessResponse<{ announcements: ActiveAnnouncement[] }>
    >({
      status: 'success',
      error: null,
      message: '요청 성공',
      data: { announcements: activeAnnouncements },
    }),
  ),
];

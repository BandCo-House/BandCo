import { http, HttpResponse } from 'msw';
import type { Schedule } from '@/entities/schedule/model/types';

export const scheduleHandlers = [
  http.post('/api/schedule', async ({ request }) => {
    const payload = (await request.json()) as Omit<
      Schedule,
      'id' | 'createdAt' | 'updatedAt'
    >;

    const now = new Date().toISOString();
    const newSchedule: Schedule = {
      ...payload,
      id: `schedule-${Date.now()}`,
      createdAt: now,
      updatedAt: now,
    } as Schedule; // 현재 회의가 있는지도 잘 모르겠고 일단 패스.... 내일정해야지..

    return HttpResponse.json(newSchedule, { status: 201 });
  }),
];

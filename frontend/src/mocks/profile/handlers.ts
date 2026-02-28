import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { Profile } from '@/entities/profile/model/types';
import { API_URL } from '../config';

const profile: Profile = {
  id: 'profile-1',
  email: 'member@example.com',
  nickname: '김민준',
  displayName: '김민준',
  bio: '음악으로 세상과 소통하는 기타리스트',
  preferredGenres: ['Rock', 'J-Pop', 'Blues'],
  profileMusic: {
    title: 'Time of our life',
    artistName: 'Day6',
    url: null,
  },
  bandSummaries: [
    { id: 'band-1', name: '신촌 락밴드' },
    { id: 'band-2', name: '홍대 인디즈' },
  ],
  skills: ['일렉기타', '통기타', '보컬'],
};

export const profileHandlers = [
  http.get(`${API_URL}/me/profile`, () => {
    return HttpResponse.json<ApiResponse<Profile>>({
      success: true,
      data: profile,
    });
  }),
  http.patch(`${API_URL}/me/profile`, async ({ request }) => {
    const body = (await request.json()) as Partial<Profile>;

    return HttpResponse.json<ApiResponse<Profile>>({
      success: true,
      data: {
        ...profile,
        ...body,
      },
    });
  }),
];

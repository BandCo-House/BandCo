import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { Invite } from '@/entities/invite/model/types';
import { API_URL } from '../config';

const invite: Invite = {
  id: 'invite-1',
  bandId: 'band-1',
  bandName: '신촌 락밴드',
  inviteeEmail: 'member@example.com',
  inviteCode: 'INV-team-1-DEMO1',
  inviteLink: 'https://example.com/invites/demo',
  token: 'token-1',
  status: 'PENDING',
};

export const inviteHandlers = [
  http.get(`${API_URL}/invites/:bandId`, () => {
    return HttpResponse.json<ApiResponse<Invite[]>>({
      success: true,
      data: [invite],
    });
  }),
  http.post(`${API_URL}/bands/:bandId/invites`, async ({ request }) => {
    const body = (await request.json()) as { inviteeEmail: string };

    return HttpResponse.json<ApiResponse<Invite>>({
      success: true,
      data: {
        ...invite,
        inviteeEmail: body.inviteeEmail,
      },
    });
  }),
  http.post(`${API_URL}/invites/:token/accept`, () => {
    return HttpResponse.json<ApiResponse<void>>({
      success: true,
      data: undefined,
    });
  }),
  http.post(`${API_URL}/invites/:token/decline`, () => {
    return HttpResponse.json<ApiResponse<void>>({
      success: true,
      data: undefined,
    });
  }),
];

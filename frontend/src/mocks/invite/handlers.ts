import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { Invite } from '@/entities/invite/model/types';
import { API_URL } from '../config';
import type { AcceptInviteResponse } from '@/features/invite-accept/api/invite-api';

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
  http.get(`${API_URL}/invitations/received`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('where__invitation_status') || 'PENDING';

    const items = Array.from({ length: 30 }, (_, i) => {
      const isRead = i < 15;
      const itemStatus = isRead ? 'ACCEPTED' : 'PENDING';
      return {
        invitationId: `uuid-invite-${i + 1}`,
        band: {
          bandId: `band-mock-${i + 1}`,
          name: `합주하자 밴드 ${i + 1}`,
          description: `함께 록 음악을 연주하는 밴드 ${i + 1}입니다.`,
        },
        inviter: {
          userId: `user-sender-${i + 1}`,
          nickname: `김민준${i + 1}`,
        },
        message: `우리 밴드 ${i + 1}에서 멋진 기타 세션을 찾고 있어요!`,
        invitationStatus: itemStatus,
        createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      };
    });

    const filtered = items.filter((item) => item.invitationStatus === status);

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '받은 초대 목록 조회 성공',
      data: {
        items: filtered,
        meta: {
          count: filtered.length,
          take: 20,
          totalCount: filtered.length,
          cursor: null,
          next: null,
        },
      },
    });
  }),
  http.get(`${API_URL}/invitations/:invitationId`, ({ params }) => {
    const { invitationId } = params;
    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '초대 조회 성공',
      data: {
        invitationId: String(invitationId),
        band: {
          bandId: 'band-mock-1',
          name: '합주하자 밴드 1',
          description: '함께 록 음악을 연주하는 밴드 1입니다.',
        },
        inviter: {
          userId: 'user-sender-1',
          nickname: '김민준1',
        },
        message: '우리 밴드 1에서 멋진 기타 세션을 찾고 있어요!',
        invitationStatus: 'PENDING',
        createdAt: new Date().toISOString(),
      },
    });
  }),

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
  http.post(`${API_URL}/invitations/:inviteId/accept`, ({ params }) => {
    const { inviteId } = params;
    return HttpResponse.json<ApiResponse<AcceptInviteResponse>>({
      success: true,
      data: {
        invitationId: String(inviteId),
        bandId: 'band-123', // mock band ID
        userId: 'user-123',
        invitationStatus: 'ACCEPTED',
        joinedAt: new Date().toISOString(),
      },
    });
  }),
  http.post(`${API_URL}/invitations/:inviteId/decline`, () => {
    return HttpResponse.json<ApiResponse<void>>({
      success: true,
      data: undefined,
    });
  }),
];

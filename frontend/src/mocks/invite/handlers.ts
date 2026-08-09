import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api';
import type { Invite } from '@/entities/invite/model/types';
import { API_URL } from '../config';
import type { AcceptInviteResponse } from '@/features/invite-accept/api/invite-api';
import { updateMockNotificationInviteStatus } from '../notification/handlers';

export interface MockInvitationItem {
  invitationId: string;
  band: {
    bandId: string;
    name: string;
    description: string;
  };
  inviter: {
    userId: string;
    nickname: string;
  };
  message: string;
  invitationStatus: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt: string;
}

export const mockInvitations: MockInvitationItem[] = Array.from(
  { length: 30 },
  (_, i) => {
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
  },
);

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
    const status =
      url.searchParams.get('where__invitation_status') || 'PENDING';

    const filtered = mockInvitations.filter(
      (item) => item.invitationStatus === status,
    );

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
    const targetId = String(invitationId);
    const found =
      mockInvitations.find((item) => item.invitationId === targetId) ||
      mockInvitations[0];

    return HttpResponse.json({
      status: 'success',
      error: null,
      message: '초대 조회 성공',
      data: {
        ...found,
        invitationId: targetId,
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
    const inviteIdStr = String(params.inviteId);
    const item = mockInvitations.find(
      (inv) => inv.invitationId === inviteIdStr,
    );
    if (item) {
      item.invitationStatus = 'ACCEPTED';
    }
    updateMockNotificationInviteStatus(inviteIdStr, 'ACCEPTED');

    return HttpResponse.json<ApiResponse<AcceptInviteResponse>>({
      success: true,
      data: {
        invitationId: inviteIdStr,
        bandId: item?.band.bandId || 'band-123',
        userId: 'user-123',
        invitationStatus: 'ACCEPTED',
        joinedAt: new Date().toISOString(),
      },
    });
  }),

  http.post(`${API_URL}/invitations/:inviteId/decline`, ({ params }) => {
    const inviteIdStr = String(params.inviteId);
    const item = mockInvitations.find(
      (inv) => inv.invitationId === inviteIdStr,
    );
    if (item) {
      item.invitationStatus = 'DECLINED';
    }
    updateMockNotificationInviteStatus(inviteIdStr, 'DECLINED');

    return HttpResponse.json<ApiResponse<void>>({
      success: true,
      data: undefined,
    });
  }),
];

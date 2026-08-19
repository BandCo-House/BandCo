import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { getBandInvitationDetail } from './invite-api';
import { useBandInvitation } from './useBandInvitation';
import type { ReactNode } from 'react';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('entities/invite API & Hooks', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe('getBandInvitationDetail', () => {
    it('초대 단건 조회 성공시 ReceivedBandInvitationListItem 데이터를 반환한다', async () => {
      server.use(
        http.get('*/invitations/invite-uuid-1', () => {
          return HttpResponse.json({
            status: 'success',
            error: null,
            message: '초대 조회 성공',
            data: {
              invitationId: 'invite-uuid-1',
              band: {
                bandId: 'band-100',
                name: '테스트 밴드',
                description: '테스트 설명',
              },
              inviter: {
                userId: 'user-200',
                nickname: '초대자',
              },
              message: '초대합니다!',
              invitationStatus: 'PENDING',
              createdAt: '2026-08-01T00:00:00.000Z',
            },
          });
        }),
      );

      const data = await getBandInvitationDetail('invite-uuid-1');
      expect(data.invitationId).toBe('invite-uuid-1');
      expect(data.band.name).toBe('테스트 밴드');
      expect(data.inviter.nickname).toBe('초대자');
    });

    it('서버 응답 status가 error인 경우 에러를 던진다', async () => {
      server.use(
        http.get('*/invitations/invalid-id', () => {
          return HttpResponse.json({
            status: 'error',
            error: 'NOT_FOUND',
            message: '초대를 찾을 수 없습니다.',
          });
        }),
      );

      await expect(getBandInvitationDetail('invalid-id')).rejects.toThrow(
        '초대를 찾을 수 없습니다.',
      );
    });
  });

  describe('useBandInvitation', () => {
    it('invitationId가 제공되었을 때 밴드 초대 정보를 정상적으로 쿼리한다', async () => {
      server.use(
        http.get('*/invitations/invite-uuid-1', () => {
          return HttpResponse.json({
            status: 'success',
            error: null,
            message: '초대 조회 성공',
            data: {
              invitationId: 'invite-uuid-1',
              band: {
                bandId: 'band-100',
                name: '테스트 밴드',
                description: '테스트 설명',
              },
              inviter: {
                userId: 'user-200',
                nickname: '초대자',
              },
              message: '초대합니다!',
              invitationStatus: 'PENDING',
              createdAt: '2026-08-01T00:00:00.000Z',
            },
          });
        }),
      );

      const { result } = renderHook(() => useBandInvitation('invite-uuid-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.band.name).toBe('테스트 밴드');
    });
  });
});

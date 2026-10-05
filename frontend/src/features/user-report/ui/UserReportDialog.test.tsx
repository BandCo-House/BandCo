import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { API_URL } from '@/mocks/config';
import { server } from '@/mocks/server';
import { UserReportDialog } from './UserReportDialog';

const REPORTED_USER_ID = 'user-002';

const renderDialog = (onOpenChange = vi.fn()) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <UserReportDialog
        open
        onOpenChange={onOpenChange}
        reportedUserId={REPORTED_USER_ID}
        reportedUserName="베이시스트"
      />
    </QueryClientProvider>,
  );
  return { onOpenChange };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('UserReportDialog', () => {
  it('사유를 고르기 전에는 제출 버튼이 비활성이고, 고르면 활성화된다', async () => {
    const user = userEvent.setup();
    renderDialog();

    const submitButton = screen.getByRole('button', { name: '신고하기' });
    expect(submitButton).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: '욕설·비방' }));

    expect(screen.getByRole('radio', { name: '욕설·비방' })).toBeChecked();
    expect(submitButton).toBeEnabled();
  });

  it('상세 내용 글자 수를 최대 길이와 함께 보여준다', async () => {
    const user = userEvent.setup();
    renderDialog();

    const textarea = screen.getByRole('textbox', { name: '상세 내용' });
    await user.type(textarea, '광고 DM');

    expect(textarea).toHaveAttribute('maxLength', '1000');
    expect(textarea).toHaveAccessibleDescription('5/1000');
  });

  it('제출하면 대상 유저 경로로 사유와 상세 내용을 보내고, 성공 토스트 후 닫힌다', async () => {
    const user = userEvent.setup();
    const successSpy = vi.spyOn(toast, 'success');
    let requestedUserId: string | undefined;
    let requestBody: unknown;
    server.use(
      http.post(
        `${API_URL}/users/:userId/reports`,
        async ({ params, request }) => {
          requestedUserId = String(params.userId);
          requestBody = await request.json();
          return HttpResponse.json(
            {
              status: 'success',
              error: null,
              message: '신고가 접수되었습니다.',
              data: { reportId: 'report-1' },
            },
            { status: 201 },
          );
        },
      ),
    );
    const { onOpenChange } = renderDialog();

    await user.click(screen.getByRole('radio', { name: '스팸·광고' }));
    await user.type(
      screen.getByRole('textbox', { name: '상세 내용' }),
      '  홍보 메시지를 반복해서 보냅니다.  ',
    );
    await user.click(screen.getByRole('button', { name: '신고하기' }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(requestedUserId).toBe(REPORTED_USER_ID);
    expect(requestBody).toEqual({
      reason: 'SPAM',
      description: '홍보 메시지를 반복해서 보냅니다.',
    });
    expect(successSpy).toHaveBeenCalledWith('신고가 접수되었습니다.');
  });

  it('상세 내용이 비어 있으면 description 없이 보낸다', async () => {
    const user = userEvent.setup();
    let requestBody: unknown;
    server.use(
      http.post(`${API_URL}/users/:userId/reports`, async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json(
          {
            status: 'success',
            error: null,
            message: '신고가 접수되었습니다.',
            data: { reportId: 'report-1' },
          },
          { status: 201 },
        );
      }),
    );
    const { onOpenChange } = renderDialog();

    await user.click(screen.getByRole('radio', { name: '기타' }));
    await user.click(screen.getByRole('button', { name: '신고하기' }));

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(requestBody).toEqual({ reason: 'OTHER' });
  });

  it('이미 처리 대기 중인 신고가 있으면(409) 서버 메시지를 토스트로 보여주고 닫지 않는다', async () => {
    const user = userEvent.setup();
    const errorSpy = vi.spyOn(toast, 'error');
    server.use(
      http.post(`${API_URL}/users/:userId/reports`, () =>
        HttpResponse.json(
          {
            status: 'fail',
            error: { code: 'CONFLICT', details: { statusCode: 409 } },
            message: '이미 접수되어 처리 대기 중인 신고가 있습니다.',
            data: {},
          },
          { status: 409 },
        ),
      ),
    );
    const { onOpenChange } = renderDialog();

    await user.click(screen.getByRole('radio', { name: '사기' }));
    await user.click(screen.getByRole('button', { name: '신고하기' }));

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        '이미 접수되어 처리 대기 중인 신고가 있습니다.',
      ),
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});

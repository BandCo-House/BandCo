import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/app/providers/auth-context';
import { createAppRouter } from '@/app/router';
import { server } from '@/mocks/server';

const LOGGED_OUT_USER = { isLoggedIn: false, isAdmin: false };

const renderLoginPage = () => {
  const router = createAppRouter();
  router.update({
    history: createMemoryHistory({ initialEntries: ['/login'] }),
    context: { user: LOGGED_OUT_USER, logout: vi.fn() },
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <AuthContext.Provider
      value={{ user: LOGGED_OUT_USER, login: vi.fn(), logout: vi.fn() }}
    >
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthContext.Provider>,
  );
};

const respondLoginFail = (statusCode: number, code: string, message: string) =>
  http.post('*/auth/login/email', () =>
    HttpResponse.json(
      {
        status: 'fail',
        error: { code, details: { statusCode } },
        message,
        data: {},
      },
      { status: statusCode },
    ),
  );

const submitEmailLogin = async () => {
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText(/이메일/), 'member@test.com');
  await user.type(screen.getByLabelText(/비밀번호/), 'password123!');
  await user.click(screen.getByRole('button', { name: '로그인' }));
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('로그인 페이지 실패 안내', () => {
  it('이용 정지 계정(403)이면 서버가 준 정지 사유 메시지를 보여준다', async () => {
    const errorSpy = vi.spyOn(toast, 'error');
    const suspendedMessage =
      '이용이 정지된 계정입니다. (해제 예정: 2026-10-10 12:00 KST)';
    server.use(respondLoginFail(403, 'FORBIDDEN', suspendedMessage));

    renderLoginPage();
    await submitEmailLogin();

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(suspendedMessage),
    );
  });

  it('자격 증명 오류(401)는 서버 메시지 대신 공통 안내를 보여준다', async () => {
    const errorSpy = vi.spyOn(toast, 'error');
    server.use(
      respondLoginFail(401, 'UNAUTHORIZED', '비밀번호가 일치하지 않습니다.'),
    );

    renderLoginPage();
    await submitEmailLogin();

    await waitFor(() =>
      expect(errorSpy).toHaveBeenCalledWith(
        '이메일 또는 비밀번호가 올바르지 않습니다.',
      ),
    );
  });
});

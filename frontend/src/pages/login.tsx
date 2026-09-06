import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers/auth-context';
import { loginEmail, loginGoogle } from '@/features/auth/api/auth.service';
import { LoginForm } from '@/features/auth/ui/LoginForm';
import { requireGuest } from '@/app/router-guards';
import { getApiErrorMessage } from '@/shared/api/error';
import { reportClientError } from '@/shared/lib/report-client-error';
import axios from 'axios';

const GOOGLE_LOGIN_FALLBACK_MESSAGE =
  'Google 로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.';

export const Route = createFileRoute('/login')({
  beforeLoad: requireGuest,
  component: LoginPage,
});

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const res = await loginEmail(email, password);
      login(res.accessToken, res.refreshToken);
      await navigate({ to: '/' });
    } catch (err) {
      if (axios.isAxiosError<{ message?: string }>(err)) {
        if (
          err.response?.status === 401 ||
          err.response?.status === 400 ||
          err.response?.status === 403 ||
          err.response?.status === 404
        ) {
          toast.error('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else {
          toast.error(
            '로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
          );
        }
      } else {
        reportClientError(err, {
          message: '로그인 중 예상하지 못한 오류가 발생했습니다.',
          source: 'LoginPage.handleLogin',
        });
        toast.error(
          '로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    try {
      setIsLoading(true);
      const res = await loginGoogle(idToken);
      login(res.accessToken, res.refreshToken);
      await navigate({ to: '/' });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        // 400·401은 백엔드가 사유(미인증 계정, 탈퇴한 계정 등)를 메시지로 주므로 그대로 보여준다.
        toast.error(
          status === 400 || status === 401
            ? getApiErrorMessage(err, GOOGLE_LOGIN_FALLBACK_MESSAGE)
            : GOOGLE_LOGIN_FALLBACK_MESSAGE,
        );
      } else {
        reportClientError(err, {
          message: 'Google 로그인 중 예상하지 못한 오류가 발생했습니다.',
          source: 'LoginPage.handleGoogleLogin',
        });
        toast.error(GOOGLE_LOGIN_FALLBACK_MESSAGE);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full flex-col justify-center">
      <LoginForm
        onSubmit={handleLogin}
        onGoogleLogin={handleGoogleLogin}
        isLoading={isLoading}
      />
    </div>
  );
}

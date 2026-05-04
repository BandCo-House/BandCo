import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '@/app/providers/auth-context';
import { loginEmail } from '@/features/auth/api/auth.service';
import { LoginForm } from '@/features/auth/ui/LoginForm';
import { requireGuest } from '@/app/router-guards';
import axios from 'axios';

export const Route = createFileRoute('/login')({
  beforeLoad: requireGuest,
  component: LoginPage,
});

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await loginEmail(email, password);
      login(res.accessToken, res.refreshToken);
      navigate({ to: '/' });
    } catch (err) {
      if (axios.isAxiosError<{ message?: string }>(err)) {
        if (
          err.response?.status === 401 ||
          err.response?.status === 400 ||
          err.response?.status === 403 ||
          err.response?.status === 404
        ) {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        } else {
          setError('로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
        }
      } else {
        console.error('로그인 중 예상하지 못한 오류가 발생했습니다.', err);
        setError('로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full flex-col justify-center">
      {error && (
        <div className="mb-6 rounded-2xl bg-destructive/10 px-5 py-4 text-center text-sm text-destructive">
          {error}
        </div>
      )}

      <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
    </div>
  );
}

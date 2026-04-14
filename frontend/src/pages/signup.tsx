import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '@/app/providers/auth-context';
import { registerEmail } from '@/features/auth/api/auth.service';
import { SignupForm } from '@/features/auth/ui/SignupForm';
import { requireGuest } from '@/app/router-guards';
import type { SignupReq } from '@/features/auth/model/auth.schema';
import { AxiosError } from 'axios';

export const Route = createFileRoute('/signup')({
  beforeLoad: requireGuest,
  component: SignupPage,
});

export function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (data: SignupReq) => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await registerEmail(data);
      // 회원가입 성공 시 자동 로그인
      login(res.accessToken, res.refreshToken);
      navigate({ to: '/' });
    } catch (err) {
      if (err instanceof AxiosError) {
        setError(err.response?.data?.message || '회원가입에 실패했습니다.');
      }
    }
    setIsLoading(false);
  };

  return (
    <div className="max-w-145 mx-auto min-h-[calc(100vh-4rem)] flex flex-col justify-center">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm text-center">
          {error}
        </div>
      )}
      <SignupForm onSubmit={handleSignup} isLoading={isLoading} />
    </div>
  );
}

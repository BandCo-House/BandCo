import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '@/app/providers/auth-context';
import { registerEmail } from '@/features/auth/api/auth.service';
import { SignupForm } from '@/features/auth/ui/SignupForm';
import { updateMyProfile } from '@/features/profile-update/api/profile-api';
import { requireGuest } from '@/app/router-guards';
import type { SignupReq } from '@/features/auth/model/auth.schema';
import axios from 'axios';

export const Route = createFileRoute('/signup')({
  beforeLoad: requireGuest,
  component: SignupPage,
  staticData: {
    header: {
      title: '회원가입',
      backBehavior: 'browser',
    },
  },
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
      try {
        await updateMyProfile({
          profile: {
            nickname: data.name,
          },
          personalInfo: {
            email: data.email,
          },
        });
        await navigate({ to: '/onboarding', search: { name: data.name } });
      } catch (profileUpdateError) {
        console.error(
          '회원가입 후 프로필 저장에 실패했습니다.',
          profileUpdateError,
        );
        await navigate({
          to: '/onboarding',
          search: { name: data.name, profileUpdateFailed: '1' },
        });
      }
    } catch (err) {
      if (axios.isAxiosError<{ message?: string }>(err)) {
        setError(err.response?.data?.message || '회원가입에 실패했습니다.');
      } else {
        setError('회원가입에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full flex-col">
      {error && (
        <div className="mb-6 rounded-2xl bg-destructive/10 px-5 py-4 text-center text-sm text-destructive">
          {error}
        </div>
      )}
      <SignupForm onSubmit={handleSignup} isLoading={isLoading} />
    </div>
  );
}

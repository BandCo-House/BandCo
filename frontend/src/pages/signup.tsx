import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers/auth-context';
import { registerEmail } from '@/features/auth/api/auth.service';
import { SignupForm } from '@/features/auth/ui/SignupForm';
import { requireGuest, sanitizeRedirectSearch } from '@/app/router-guards';
import type { SignupReq } from '@/features/auth/model/auth.schema';
import { getApiErrorMessage } from '@/shared/api';

export const Route = createFileRoute('/signup')({
  beforeLoad: requireGuest,
  // 로그인에서 넘어온 복귀 경로(예: 초대 링크). 온보딩까지 관통시켜 가입 후 되돌아간다.
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: sanitizeRedirectSearch(search.redirect),
  }),
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
  const { redirect } = Route.useSearch();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (data: SignupReq) => {
    try {
      setIsLoading(true);
      const res = await registerEmail(data);
      // 회원가입 성공 시 자동 로그인 (이름은 가입 요청에서 프로필 닉네임으로 저장된다)
      login(res.accessToken, res.refreshToken);
      await navigate({
        to: '/onboarding',
        search: { name: data.nickname, redirect },
      });
    } catch (err) {
      toast.error(getApiErrorMessage(err, '회원가입에 실패했습니다.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full flex-col">
      <SignupForm onSubmit={handleSignup} isLoading={isLoading} />
    </div>
  );
}

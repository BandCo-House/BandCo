import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers/auth-context';
import { registerEmail } from '@/features/auth/api/auth.service';
import { SignupForm } from '@/features/auth/ui/SignupForm';
import { changeHandle } from '@/features/profile-update/api/handle-api';
import { getUserIdFromToken } from '@/shared/lib/jwt';
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

/**
 * 가입 API가 고유 ID를 받지 않아 가입 직후 #72로 따로 저장한다. 중복 확인(#71)도 로그인이
 * 필요해 가입 전에는 못 하므로, 여기서 겹치면 계정은 이미 만들어진 뒤다. 가입을 되돌리지 않고
 * 프로필에서 다시 정하게 안내한다 — 처음 설정은 7일 제한에 세지 않아 바로 바꿀 수 있다.
 */
const saveHandleAfterSignup = async (accessToken: string, handle: string) => {
  const userId = getUserIdFromToken(accessToken);

  try {
    if (!userId) throw new Error('가입 토큰에서 유저 ID를 읽지 못했습니다.');
    await changeHandle(userId, handle);
  } catch {
    // 서버 문구를 붙이면 문장이 두 개 겹쳐 길어진다. 다음 행동만 알린다.
    toast.error('고유 ID를 저장하지 못했어요. 프로필에서 다시 정해 주세요.');
  }
};

export function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (data: SignupReq) => {
    const { handle, ...registerData } = data;

    try {
      setIsLoading(true);
      const res = await registerEmail(registerData);
      // 회원가입 성공 시 자동 로그인 (이름은 가입 요청에서 프로필 닉네임으로 저장된다)
      login(res.accessToken, res.refreshToken);
      await saveHandleAfterSignup(res.accessToken, handle);
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

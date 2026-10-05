import { useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getRouteApi, useRouter } from '@tanstack/react-router';

import { authKeys, useLogin } from '@/features/auth/api';
import { APP_BASE_PATH } from '@/shared/api/config';
import { setTokens } from '@/shared/lib/auth-storage';
import { Button } from '@/shared/ui/Button';
import { Field, Input } from '@/shared/ui/Input';

const routeApi = getRouteApi('/login');

export const LoginPage = () => {
  const { redirect } = routeApi.useSearch();
  const router = useRouter();
  const queryClient = useQueryClient();
  const login = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    login.mutate(
      { email: email.trim(), password },
      {
        onSuccess: ({ accessToken, refreshToken, admin }) => {
          setTokens(accessToken, refreshToken);
          queryClient.setQueryData(authKeys.me, admin);
          // 앱 내부 경로로만 돌아간다. redirect는 라우터 기준 경로라 브라우저 주소로 바꿀 때 기준 경로를 붙인다.
          const target = redirect?.startsWith('/') ? redirect : '/';
          router.history.push(`${APP_BASE_PATH}${target}`);
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-lg border border-slate-200 bg-white p-8 shadow-sm"
      >
        <div>
          <h1 className="text-lg font-bold text-slate-900">BandCo 어드민</h1>
          <p className="mt-1 text-sm text-slate-500">
            운영자 계정으로 로그인하세요.
          </p>
        </div>
        <Field label="이메일">
          <Input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="비밀번호">
          <Input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full" loading={login.isPending}>
          로그인
        </Button>
      </form>
    </div>
  );
};

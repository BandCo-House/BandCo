import React, { useState } from 'react';
import { loginSchema } from '../model/auth.schema';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { SocialLoginSection } from '@/shared/ui/social-login-section';
import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  onGoogleLogin?: (idToken: string) => void;
  isLoading?: boolean;
}

interface AuthRoundedInputProps {
  id: 'email' | 'password';
  type: 'email' | 'password';
  value: string;
  placeholder: string;
  hasError: boolean;
  errorMessage?: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

interface SplitLinkRowProps {
  left: ReactNode;
  right: ReactNode;
  className?: string;
}

type AuthRowLinkProps =
  | {
      children: ReactNode;
      to: '/signup' | '/forgot-password';
      onClick?: never;
    }
  | {
      children: ReactNode;
      to?: never;
      onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    };

const AuthRoundedInput = ({
  id,
  type,
  value,
  placeholder,
  hasError,
  errorMessage,
  onChange,
}: AuthRoundedInputProps) => {
  const label = id === 'email' ? '이메일' : '비밀번호';

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Input
        id={id}
        type={type}
        variant="roundedFull"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={hasError}
      />
      {errorMessage ? (
        <p className="ml-4 text-xs text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
};

const SplitLinkRow = ({ left, right, className }: SplitLinkRowProps) => {
  return (
    <div className={cn(className, 'flex items-center')}>
      <div className="flex min-w-0 flex-1 justify-center">{left}</div>
      <span className="h-7 w-px shrink-0 bg-overlay-40"></span>
      <div className="flex min-w-0 flex-1 justify-center">{right}</div>
    </div>
  );
};

const authRowLinkClassName =
  'inline-flex w-full justify-center whitespace-nowrap px-2 py-1 text-center text-grey-200 transition-colors hover:text-grey-50 hover:underline focus-visible:text-grey-50 focus-visible:underline';

const AuthRowLink = ({ children, to, onClick }: AuthRowLinkProps) => {
  if (to) {
    return (
      <Link to={to} className={authRowLinkClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={authRowLinkClassName}>
      {children}
    </button>
  );
};

/**
 * 이메일과 비밀번호를 입력받아 로그인 요청을 제출하는 폼을 렌더링한다.
 */
export const LoginForm = ({
  onSubmit,
  onGoogleLogin,
  isLoading = false,
}: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const isFormValid = loginSchema.safeParse({ email, password }).success;

  /**
   * 입력값을 검증하고 유효한 경우 로그인 요청 콜백을 호출한다.
   */
  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({});

    const result = loginSchema.safeParse({ email, password });

    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path === 'email') fieldErrors.email = issue.message;
        if (path === 'password') fieldErrors.password = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    onSubmit(email, password);
  };

  return (
    <div className="flex min-h-full w-full flex-col justify-center px-4 py-10 text-muted">
      <div className="mb-16 text-center">
        <h1 className="text-[3rem] font-extrabold tracking-tight text-grey-50">
          BandCo
        </h1>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <AuthRoundedInput
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="이메일을 입력하세요."
          hasError={!!errors.email}
          errorMessage={errors.email}
        />
        <AuthRoundedInput
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="비밀번호를 입력하세요."
          hasError={!!errors.password}
          errorMessage={errors.password}
        />

        <Button
          type="submit"
          variant="shining"
          size="lg"
          disabled={isLoading || !isFormValid}
          className="mt-4 w-full"
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </Button>
      </form>

      <SplitLinkRow
        className="mt-7"
        left={<AuthRowLink to="/signup">회원가입</AuthRowLink>}
        right={<AuthRowLink to="/forgot-password">비밀번호 찾기</AuthRowLink>}
      />

      <SocialLoginSection
        className="mt-20"
        onGoogleCredential={onGoogleLogin}
      />

      <SplitLinkRow
        className="mt-20 typo-base-m"
        left={
          <AuthRowLink onClick={() => undefined}>개인정보처리방침</AuthRowLink>
        }
        right={<AuthRowLink onClick={() => undefined}>이용약관</AuthRowLink>}
      />
    </div>
  );
};

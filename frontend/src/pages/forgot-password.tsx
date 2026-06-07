import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { requireGuest } from '@/app/router-guards';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

export const Route = createFileRoute('/forgot-password')({
  beforeLoad: requireGuest,
  component: ForgotPasswordPage,
});

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  /**
   * 비밀번호 재설정 메일 발송 요청을 처리한다.
   */
  const handleResetSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) return;

    setMessage(`${trimmedEmail}로 비밀번호 재설정 안내를 보냈습니다.`);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full flex-col justify-center">
      <div className="flex min-h-full flex-col justify-center px-4 py-10 text-muted">
        <div className="mb-14 text-center">
          <h1 className="text-[3rem] font-extrabold tracking-tight text-grey-50">
            BandCo
          </h1>
          <p className="mt-5 typo-base-m text-grey-200">
            가입한 이메일로 비밀번호 재설정 안내를 보내드립니다.
          </p>
        </div>

        <form onSubmit={handleResetSubmit} className="flex flex-col gap-3.5">
          <div className="flex flex-col gap-2">
            <label htmlFor="reset-email" className="sr-only">
              이메일
            </label>
            <Input
              id="reset-email"
              type="email"
              variant="roundedFull"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="이메일을 입력하세요."
              className="text-grey-50"
            />
          </div>

          <Button
            type="submit"
            variant="shining"
            size="lg"
            disabled={email.trim() === ''}
            className="mt-5 w-full"
          >
            재설정 메일 보내기
          </Button>
          {message ? (
            <p aria-live="polite" className="px-4 typo-sm-m text-foreground">
              {message}
            </p>
          ) : null}
        </form>

        <div className="mt-8">
          <Link
            to="/login"
            className="block w-full px-2 py-1 text-center typo-base-m text-grey-200 transition-colors hover:text-grey-50 hover:underline focus-visible:text-grey-50 focus-visible:underline"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

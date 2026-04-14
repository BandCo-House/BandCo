import React, { useState } from 'react';
import { loginSchema } from '../model/auth.schema';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Link } from '@tanstack/react-router';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  isLoading?: boolean;
}

export const LoginForm = ({ onSubmit, isLoading = false }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const handleSubmit = (e: React.FormEvent) => {
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
    <div>
      <div className="text-center mb-10">
        <h1 className="text-[46px] font-extrabold tracking-tight text-primary-dark">
          BandCo
        </h1>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            이메일
          </label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@email.com"
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            비밀번호
          </label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호 입력"
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password}</p>
          )}
        </div>

        <Button type="submit" disabled={isLoading} className="mt-2 w-full">
          {isLoading ? '로그인 중...' : '로그인'}
        </Button>
      </form>
      <div className="mt-8 pt-6 border-t border-slate-200">
        <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
          <Link
            to="/signup"
            className="hover:text-primary transition-colors font-medium"
          >
            회원가입
          </Link>
          <span className="w-px h-3 bg-slate-300"></span>
          <a href="#" className="hover:text-primary transition-colors">
            아이디 찾기
          </a>
          <span className="w-px h-3 bg-slate-300"></span>
          <a href="#" className="hover:text-primary transition-colors">
            비밀번호 찾기
          </a>
        </div>
      </div>
    </div>
  );
};

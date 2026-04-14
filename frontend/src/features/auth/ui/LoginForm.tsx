import React, { useState } from 'react';
import { loginSchema } from '../model/auth.schema';
import { Button } from '@/shared/ui/button';
import { Link } from '@tanstack/react-router';

interface LoginFormProps {
  onSubmit: (email: string, password: string) => void;
  isLoading?: boolean;
}

import { FloatingInput } from '@/shared/ui/floating-input';

export const LoginForm = ({ onSubmit, isLoading = false }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const isFormEmpty = email.trim() === '' || password.trim() === '';

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
        <Link
          to="/"
          className="text-[46px] font-extrabold tracking-tight text-primary-dark"
        >
          BandCo
        </Link>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <div className="flex flex-col gap-1.5">
          <FloatingInput
            id="email"
            type="email"
            label="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요."
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-xs text-destructive ml-4">{errors.email}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <FloatingInput
            id="password"
            type="password"
            label="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요."
            aria-invalid={!!errors.password}
          />
          {errors.password && (
            <p className="text-xs text-destructive ml-4">{errors.password}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading || isFormEmpty}
          className={` opacity-100! mt-4 w-full rounded-[14px] h-12 text-lg ${isFormEmpty ? 'cursor-not-allowed bg-primary-surface text-primary-light' : ''}`}
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </Button>
      </form>
      <div className="mt-8 pt-6 ">
        <div className="flex items-center justify-center gap-4 text-sm text-primary-light typo-base-m">
          <Link
            to="/signup"
            className=" hover:text-primary transition-colors font-medium"
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

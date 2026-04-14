import React, { useState } from 'react';
import { signupSchema, type SignupReq } from '../model/auth.schema';
import { Button } from '@/shared/ui/button';
import { Link } from '@tanstack/react-router';

interface SignupFormProps {
  onSubmit: (data: SignupReq) => void;
  isLoading?: boolean;
}

import { FloatingInput } from '@/shared/ui/floating-input';

export const SignupForm = ({
  onSubmit,
  isLoading = false,
}: SignupFormProps) => {
  const [formData, setFormData] = useState<SignupReq>({
    email: '',
    password: '',
    name: '',
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof SignupReq, string>>
  >({});

  const isFormEmpty =
    formData.email.trim() === '' ||
    formData.password.trim() === '' ||
    formData.name.trim() === '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse(formData);

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignupReq, string>> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof SignupReq;
        fieldErrors[path] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <div className="">
      <div className="text-center mb-20">
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
            id="name"
            label="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="이름을 입력하세요."
            aria-invalid={!!errors.name}
          />
          {errors.name && (
            <p className="text-xs text-destructive ml-4">{errors.name}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <FloatingInput
            id="email"
            type="email"
            label="email"
            value={formData.email}
            onChange={handleChange}
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
            value={formData.password}
            onChange={handleChange}
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
          {isLoading ? '처리 중...' : '회원가입'}
        </Button>
      </form>
      <div className="mt-8 pt-6">
        <div className="flex items-center justify-center typo-base-m text-primary-light">
          <span className="mr-2">이미 계정이 있으신가요?</span>
          <Link to="/login" className="hover:text-primary transition-colors">
            로그인하러 가기
          </Link>
        </div>
      </div>
    </div>
  );
};

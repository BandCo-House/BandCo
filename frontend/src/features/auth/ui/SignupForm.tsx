import React, { useState } from "react";
import { signupSchema, type SignupReq } from "../model/auth.schema";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

interface SignupFormProps {
  onSubmit: (data: SignupReq) => void;
  isLoading?: boolean;
}

export const SignupForm = ({ onSubmit, isLoading = false }: SignupFormProps) => {
  const [formData, setFormData] = useState<SignupReq>({
    email: "",
    password: "",
    name: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignupReq, string>>>({});

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          이름
        </label>
        <Input
          id="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="이름 입력"
          aria-invalid={!!errors.name}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          이메일
        </label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="example@email.com"
          aria-invalid={!!errors.email}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          비밀번호
        </label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="비밀번호(6-12자, 영문/숫자 포함)"
          aria-invalid={!!errors.password}
        />
        {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
      </div>

      <Button type="submit" disabled={isLoading} className="mt-2 w-full">
        {isLoading ? "처리 중..." : "회원가입"}
      </Button>
    </form>
  );
};

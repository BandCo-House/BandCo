import { z } from 'zod';

/**
 * 비밀번호 규칙:
 * - 6자 이상 12자 이하
 * - 숫자 및 영문(대소문자 상관없음) 필수 포함
 * - 허용 특수문자: Shift + 1~0 (!@#$%^&*())
 */
const passwordRegex = /^(?=.*[a-z])(?=.*\d)[a-z\d!@#$%^&*()]+$/i;

export const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z
    .string()
    .min(6, '비밀번호는 최소 6자 이상이어야 합니다.')
    .max(12, '비밀번호는 최대 12자 이내여야 합니다.')
    .regex(
      passwordRegex,
      '비밀번호는 영문, 숫자, 특수문자(!@#$%^&*())만 사용할 수 있습니다.',
    ),
});

export const signupSchema = loginSchema.extend({
  name: z.string().min(2, '이름은 2자 이상이어야 합니다.'),
});

export type LoginReq = z.infer<typeof loginSchema>;
export type SignupReq = z.infer<typeof signupSchema>;

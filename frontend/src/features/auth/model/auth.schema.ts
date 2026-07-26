import { z } from 'zod';

const passwordAllowedCharactersRegex = /^[a-z\d!@#$%^&*()]+$/i;
const passwordLetterRegex = /[a-z]/i;
const passwordNumberRegex = /\d/;
const passwordSpecialCharacterRegex = /[!@#$%^&*()]/;

export const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .regex(
      passwordAllowedCharactersRegex,
      '비밀번호에는 영문, 숫자, 특수문자(!@#$%^&*())만 사용할 수 있습니다.',
    )
    .regex(passwordLetterRegex, '비밀번호에는 영문을 1개 이상 포함해주세요.')
    .regex(passwordNumberRegex, '비밀번호에는 숫자를 1개 이상 포함해주세요.')
    .regex(
      passwordSpecialCharacterRegex,
      '비밀번호에는 특수문자(!@#$%^&*())를 1개 이상 포함해주세요.',
    ),
});

export const signupSchema = loginSchema.extend({
  name: z.string().min(2, '이름은 2자 이상이어야 합니다.'),
});

export type LoginReq = z.infer<typeof loginSchema>;
export type SignupReq = z.infer<typeof signupSchema>;

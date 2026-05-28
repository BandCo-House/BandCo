import { z } from 'zod';

export const profileEditSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(2, '닉네임은 2자 이상이어야 합니다.')
    .max(255, '닉네임은 최대 255자 이내여야 합니다.'),
  selfDescription: z.string().nullable().or(z.literal('')),
  profileMusicUrl: z.string().nullable().or(z.literal('')),
});

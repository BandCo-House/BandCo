import { z } from 'zod';

export const bandCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, '밴드 이름을 입력해주세요')
    .max(40, '밴드 이름은 40자 이하로 입력해주세요'),
  description: z
    .string()
    .trim()
    .max(200, '밴드 소개는 200자 이하로 입력해주세요')
    .nullable()
    .default(null),
  visibility: z.boolean().default(false),
  genreIds: z.array(z.string()).optional(),
  coverImgUrl: z.string().nullable().optional(),
  inviteeUserIds: z.array(z.string()).optional(),
});

export type BandCreateFormValues = z.infer<typeof bandCreateSchema>;

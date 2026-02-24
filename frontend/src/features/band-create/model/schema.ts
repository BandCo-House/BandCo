import { z } from 'zod';

export const bandCreateSchema = z.object({
  name: z.string().trim().min(1, '밴드 이름을 입력해주세요'),
});

export type BandCreateFormValues = z.infer<typeof bandCreateSchema>;

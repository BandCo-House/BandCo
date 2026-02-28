import { z } from 'zod';

export const joinRequestStatusSchema = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
]);

export const joinRequestSchema = z.object({
  id: z.string(),
  bandId: z.string(),
  message: z.string().default(''),
  status: joinRequestStatusSchema.default('PENDING'),
});

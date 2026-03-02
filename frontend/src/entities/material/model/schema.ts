import { z } from 'zod';

export const fileMaterialSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string().url().nullable().default(null),
  uploadedAt: z.string().default(''),
});

export const videoMaterialSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url(),
  uploadedAt: z.string().default(''),
});

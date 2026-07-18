import type { z } from 'zod';
import { bandSchema, bandDetailSchema } from './schema';

export type Band = z.infer<typeof bandSchema>;
export type BandDetail = z.infer<typeof bandDetailSchema>;

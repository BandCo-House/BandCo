import type { z } from 'zod';
import { bandSchema } from './schema';

export type Band = z.infer<typeof bandSchema>;

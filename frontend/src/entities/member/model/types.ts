import type { z } from 'zod';
import { memberSchema } from './schema';

export type Member = z.infer<typeof memberSchema>;

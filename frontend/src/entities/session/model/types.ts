import type { z } from 'zod';
import { sessionSchema } from './schema';

export type Session = z.infer<typeof sessionSchema>;

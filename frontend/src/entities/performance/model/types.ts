import type { z } from 'zod';
import { performanceSchema } from './schema';

export type Performance = z.infer<typeof performanceSchema>;

import type { z } from 'zod';
import { songSchema } from './schema';

export type Song = z.infer<typeof songSchema>;

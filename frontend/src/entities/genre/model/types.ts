import type { z } from 'zod';
import type { genreSchema } from './schema';

export type Genre = z.infer<typeof genreSchema>;

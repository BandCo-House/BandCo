import type { z } from 'zod';
import { placeSchema } from './schema';

export type Place = z.infer<typeof placeSchema>;

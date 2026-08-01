import type { z } from 'zod';
import { bandSchema, bandDetailSchema, searchBandItemSchema } from './schema';

export type Band = z.infer<typeof bandSchema>;
export type BandDetail = z.infer<typeof bandDetailSchema>;
export type SearchBandItem = z.infer<typeof searchBandItemSchema>;

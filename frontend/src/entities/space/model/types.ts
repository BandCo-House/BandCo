import type { z } from 'zod';
import { spaceSchema, spaceTypeSchema } from './schema';

export type Space = z.infer<typeof spaceSchema>;
export type SpaceType = z.infer<typeof spaceTypeSchema>;

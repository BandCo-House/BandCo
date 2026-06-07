import type { z } from 'zod';
import { bandSpaceSchema, spaceStatusSchema, spaceTypeSchema } from './schema';

export type Space = z.infer<typeof bandSpaceSchema>;
export type SpaceType = z.infer<typeof spaceTypeSchema>;
export type SpaceStatus = z.infer<typeof spaceStatusSchema>;

import type { z } from 'zod';
import { teamSchema } from './schema';

export type Team = z.infer<typeof teamSchema>;

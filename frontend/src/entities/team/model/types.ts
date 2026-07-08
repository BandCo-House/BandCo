import type { z } from 'zod';
import { teamSchema, bandTeamListItemSchema } from './schema';

export type Team = z.infer<typeof teamSchema>;
export type BandTeamListItem = z.infer<typeof bandTeamListItemSchema>;

import type { z } from 'zod';
import { songTeamSchema } from './schema';

export type SongTeam = z.infer<typeof songTeamSchema>;

import type { z } from 'zod';
import { songListItemSchema } from './schema';

export type SongListItem = z.infer<typeof songListItemSchema>;

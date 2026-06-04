import type { z } from 'zod';
import { profileMusicSchema, profileSchema } from './schema';

export type Profile = z.infer<typeof profileSchema>;
export type ProfileMusic = z.infer<typeof profileMusicSchema>;

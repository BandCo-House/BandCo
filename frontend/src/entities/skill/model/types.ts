import type { z } from 'zod';
import type { skillTypeSchema } from './schema';

export type SkillType = z.infer<typeof skillTypeSchema>;

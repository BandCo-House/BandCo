import { z } from 'zod';
import { userSearchItemSchema, userSkillSchema } from './schema';

export type UserSkill = z.infer<typeof userSkillSchema>;
export type UserSearchItem = z.infer<typeof userSearchItemSchema>;

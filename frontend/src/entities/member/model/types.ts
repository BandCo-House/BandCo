import type { z } from 'zod';
import { bandMemberListItemSchema, bandMemberSkillSchema } from './schema';

export type BandMemberSkill = z.infer<typeof bandMemberSkillSchema>;
export type BandMemberListItem = z.infer<typeof bandMemberListItemSchema>;
export type BandMember = BandMemberListItem;

export type BandMemberRole = 'BM' | 'ADMIN' | 'MEMBER';


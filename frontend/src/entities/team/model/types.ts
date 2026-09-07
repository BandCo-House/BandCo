import type { z } from 'zod';
import {
  teamSchema,
  bandTeamListItemSchema,
  teamDetailSchema,
  teamMemberSchema,
} from './schema';

export type Team = z.infer<typeof teamSchema>;
export type BandTeamListItem = z.infer<typeof bandTeamListItemSchema>;
export type TeamDetail = z.infer<typeof teamDetailSchema>;
export type TeamMember = z.infer<typeof teamMemberSchema>;

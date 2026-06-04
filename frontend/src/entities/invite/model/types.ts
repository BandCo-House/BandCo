import type { z } from 'zod';
import { inviteSchema, inviteStatusSchema } from './schema';

export type Invite = z.infer<typeof inviteSchema>;
export type InviteStatus = z.infer<typeof inviteStatusSchema>;

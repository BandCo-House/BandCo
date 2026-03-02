import type { z } from 'zod';
import { joinRequestSchema, joinRequestStatusSchema } from './schema';

export type JoinRequest = z.infer<typeof joinRequestSchema>;
export type JoinRequestStatus = z.infer<typeof joinRequestStatusSchema>;

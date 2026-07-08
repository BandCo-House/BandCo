import { z } from 'zod';

export const teamSchema = z.object({
  id: z.string(),
  songId: z.string(),
  name: z.string(),
  sessionNames: z.array(z.string()).default([]),
  memberIds: z.array(z.string()).default([]),
});

/** 밴드 팀 목록(GET /bands/:bandId/teams) item. */
export const bandTeamListItemSchema = z.object({
  teamId: z.string(),
  name: z.string(),
  description: z.string().nullable().default(null),
  status: z.string().default(''),
  teamCoverUrl: z.string().nullable().default(null),
  memberCount: z.number().default(0),
  teamLeader: z
    .object({ userId: z.string(), nickname: z.string() })
    .nullable()
    .default(null),
  createdAt: z.string().optional(),
});

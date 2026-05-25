import { apiPost } from '@/shared/api';
import { z } from 'zod';
import type { BandCreateFormValues } from '../model/schema';

export const bandGenreItemSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const createBandInvitationSuccessItemSchema = z.object({
  userId: z.string(),
  invitationId: z.string(),
});

export const createBandInvitationFailedItemSchema = z.object({
  userId: z.string(),
  reason: z.string(),
});

export const bandCreateResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  visibility: z.boolean(),
  coverImgUrl: z.string().nullable(),
  genres: z.array(bandGenreItemSchema),
  bandMasterUserId: z.string(),
  createdAt: z.string(),
  invitations: z.object({
    success: z.array(createBandInvitationSuccessItemSchema),
    failed: z.array(createBandInvitationFailedItemSchema),
  }),
});

export type BandCreateResponse = z.infer<typeof bandCreateResponseSchema>;

export const createBand = (
  data: BandCreateFormValues,
): Promise<BandCreateResponse> =>
  apiPost<{ items: BandCreateResponse }>('/bands', data).then((response) =>
    bandCreateResponseSchema.parse(response.items),
  );

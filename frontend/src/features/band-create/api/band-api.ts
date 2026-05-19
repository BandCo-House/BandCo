import { apiPost } from '@/shared/api';
import { bandSummarySchema } from '@/entities/band/model/schema';
import { z } from 'zod';
import type { BandCreateFormValues } from '../model/schema';

export const bandCreateResponseSchema = bandSummarySchema.extend({
  updatedAt: z.string(),
});

export type BandCreateResponse = z.infer<typeof bandCreateResponseSchema>;

export const createBand = (
  data: BandCreateFormValues,
): Promise<BandCreateResponse> =>
  apiPost<{ band: BandCreateResponse }>('/bands', data).then(
    (response) => bandCreateResponseSchema.parse(response.band),
  );

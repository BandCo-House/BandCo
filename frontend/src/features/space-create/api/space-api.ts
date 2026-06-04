import { apiPost } from '@/shared/api';
import type { Space, SpaceType } from '@/entities/space/model/types';

export interface CreateSpaceRequest {
  name: string;
  description?: string;
  spaceType?: SpaceType;
  eventDate?: string | null;
}

export const createSpace = (
  bandId: string,
  data: CreateSpaceRequest,
): Promise<Space> => apiPost<Space>(`/bands/${bandId}/spaces`, data);

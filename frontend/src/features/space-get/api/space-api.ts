import { apiGet } from '@/shared/api';
import type { Space } from '@/entities/space/model/types';

export const getSpace = (spaceId: string): Promise<Space> =>
  apiGet<Space>(`/spaces/${spaceId}`);

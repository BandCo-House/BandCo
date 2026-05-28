import { apiClient } from '@/shared/api';
import type { Band } from '../model/types';
import { bandListResponseSchema } from '../model/schema';

export const getBands = async (): Promise<Band[]> => {
  const response = await apiClient.get('/bands');
  const parsed = bandListResponseSchema.parse(response.data);
  return parsed.data.items;
};

export const getMyBands = async (): Promise<Band[]> => {
  const response = await apiClient.get('/bands/me');
  const parsed = bandListResponseSchema.parse(response.data);
  return parsed.data.items;
};

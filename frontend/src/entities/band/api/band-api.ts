import { apiClient } from '@/shared/api';
import type { Band } from '../model/types';

interface BandListApiResponse {
  status: 'success' | 'error';
  error: string | null;
  message: string;
  data: {
    totalCount: number;
    bands: Band[];
  };
}

export const getBands = async (): Promise<Band[]> => {
  const response = await apiClient.get<BandListApiResponse>('/bands');
  return response.data.data.bands;
};

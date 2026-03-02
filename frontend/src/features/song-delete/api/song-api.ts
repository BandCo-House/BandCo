import { apiDelete } from '@/shared/api';

export const deleteSong = (songId: string): Promise<void> =>
  apiDelete<void>(`/songs/${songId}`);

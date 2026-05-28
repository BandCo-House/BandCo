import { apiGet } from '@/shared/api';
import type { Genre } from '../model/types';

export const getGenres = (): Promise<Genre[]> =>
  apiGet<Genre[]>('/common/genres');

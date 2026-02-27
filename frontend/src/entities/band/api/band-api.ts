import { apiGet } from '@/shared/api';
import type { Band } from '../model/types';

export const getBands = (): Promise<Band[]> => apiGet<Band[]>('/bands');

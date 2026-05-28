import { apiGet } from '@/shared/api';
import type { SkillType } from '../model/types';

export const getSkillTypes = (): Promise<SkillType[]> =>
  apiGet<SkillType[]>('/common/skills');

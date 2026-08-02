import { apiGet } from '@/shared/api';
import type { SkillType } from '../model/types';

/** 스킬(포지션) 목록. 백엔드가 `{ skills }`로 감싸 돌려주므로 배열만 꺼낸다. */
export const getSkillTypes = async (): Promise<SkillType[]> => {
  const { skills } = await apiGet<{ skills: SkillType[] }>('/common/skills');
  return skills;
};

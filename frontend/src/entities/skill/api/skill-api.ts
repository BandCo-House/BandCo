import { apiGet } from '@/shared/api';
import { skillTypeListResponseSchema } from '../model/schema';
import type { SkillType } from '../model/types';

/**
 * 스킬(포지션) 목록.
 * 백엔드는 `{ skills: [{ skillTypeId, name }] }`로 주므로 언랩하고 `id`로 맞춰 돌려준다.
 */
export const getSkillTypes = async (): Promise<SkillType[]> => {
  const data = await apiGet<unknown>('/common/skills');
  return skillTypeListResponseSchema
    .parse(data)
    .skills.map(({ skillTypeId, name }) => ({ id: skillTypeId, name }));
};

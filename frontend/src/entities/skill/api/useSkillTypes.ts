import { useQuery } from '@tanstack/react-query';
import { getSkillTypes } from './skill-api';
import type { SkillType } from '../model/types';

export const skillKeys = {
  all: ['skills'] as const,
  types: () => [...skillKeys.all, 'types'] as const,
};

/**
 * 동적으로 플레이 파트 목록을 조회 및 캐싱하는 쿼리 훅
 */
export const useSkillTypes = (enabled: boolean = true) => {
  return useQuery<SkillType[]>({
    queryKey: skillKeys.types(),
    queryFn: getSkillTypes,
    staleTime: 5 * 60 * 1000, // 5분 캐시 유지
    enabled,
  });
};

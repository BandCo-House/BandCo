import { apiGet } from '@/shared/api/client';
import type { OnboardingOption } from '../model/onboarding-options';

/**
 * 온보딩에서 선택 가능한 장르 목록을 조회한다.
 */
export const getGenreOptions = async (): Promise<OnboardingOption[]> => {
  return apiGet<OnboardingOption[]>('/onboarding/genres');
};

/**
 * 온보딩에서 선택 가능한 포지션 목록을 조회한다.
 */
export const getPartOptions = async (): Promise<OnboardingOption[]> => {
  return apiGet<OnboardingOption[]>('/onboarding/parts');
};

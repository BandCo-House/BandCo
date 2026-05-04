import { useQuery } from '@tanstack/react-query';
import { getGenreOptions, getPartOptions } from './onboarding-api';

export const onboardingOptionKeys = {
  all: ['onboarding-options'] as const,
  genres: () => [...onboardingOptionKeys.all, 'genres'] as const,
  parts: () => [...onboardingOptionKeys.all, 'parts'] as const,
};

const onboardingOptionsStaleTime = 5 * 60 * 1000;

/**
 * 온보딩 장르 선택지를 조회한다.
 */
export const useGenreOptions = () => {
  return useQuery({
    queryKey: onboardingOptionKeys.genres(),
    queryFn: getGenreOptions,
    staleTime: onboardingOptionsStaleTime,
  });
};

/**
 * 온보딩 포지션 선택지를 조회한다.
 */
export const usePartOptions = () => {
  return useQuery({
    queryKey: onboardingOptionKeys.parts(),
    queryFn: getPartOptions,
    staleTime: onboardingOptionsStaleTime,
  });
};

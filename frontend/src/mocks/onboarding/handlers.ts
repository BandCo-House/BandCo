import { http, HttpResponse } from 'msw';
import type { ApiResponse } from '@/shared/api/types';
import {
  genreOptions,
  partOptions,
  type OnboardingOption,
} from '@/features/onboarding/model/onboarding-options';

export const onboardingHandlers = [
  http.get('*/onboarding/genres', () => {
    return HttpResponse.json<ApiResponse<OnboardingOption[]>>({
      success: true,
      data: genreOptions,
    });
  }),

  http.get('*/onboarding/parts', () => {
    return HttpResponse.json<ApiResponse<OnboardingOption[]>>({
      success: true,
      data: partOptions,
    });
  }),
];

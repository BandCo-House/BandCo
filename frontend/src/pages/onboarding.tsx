import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { requireLogin } from '@/app/router-guards';
import {
  useGenreOptions,
  usePartOptions,
} from '@/features/onboarding/api/useOnboardingOptions';
import {
  OnboardingFlow,
  type OnboardingResult,
} from '@/features/onboarding/ui/OnboardingFlow';
import { updateMyProfile } from '@/features/profile-update/api/profile-api';

type OnboardingSearch = {
  name?: string;
};

export const Route = createFileRoute('/onboarding')({
  beforeLoad: requireLogin,
  validateSearch: (search: Record<string, unknown>): OnboardingSearch => ({
    name: typeof search.name === 'string' ? search.name : undefined,
  }),
  component: OnboardingPage,
});

/**
 * 회원가입 직후 선호 장르와 플레이 파트를 선택하는 온보딩 페이지를 렌더링한다.
 */
function OnboardingPage() {
  const navigate = useNavigate();
  const { name } = Route.useSearch();
  const genreOptionsQuery = useGenreOptions();
  const partOptionsQuery = usePartOptions();

  /**
   * 온보딩 완료 또는 건너뛰기 후 홈으로 이동한다.
   */
  const handleComplete = async (result: OnboardingResult) => {
    const hasOnboardingResult =
      result.favoriteGenreIds.length > 0 || result.skillTypeIds.length > 0;

    if (hasOnboardingResult) {
      await updateMyProfile({
        favoriteGenres: result.favoriteGenreIds,
        skills: result.skillTypeIds.map((skillTypeId, index) => ({
          skillTypeId,
          level: 'INTERMEDIATE',
          isPrimary: index === 0,
        })),
      });
    }

    await navigate({ to: '/' });
  };

  return (
    <OnboardingFlow
      userName={name}
      genres={genreOptionsQuery.data}
      parts={partOptionsQuery.data}
      onComplete={handleComplete}
    />
  );
}

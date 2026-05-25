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
import { updateUserProfile } from '@/features/profile-update/api/profile-api';
import { useAuth } from '@/app/providers/auth-context';

type OnboardingSearch = {
  name?: string;
  profileUpdateFailed?: string;
};

export const Route = createFileRoute('/onboarding')({
  beforeLoad: requireLogin,
  validateSearch: (search: Record<string, unknown>): OnboardingSearch => ({
    name: typeof search.name === 'string' ? search.name : undefined,
    profileUpdateFailed:
      typeof search.profileUpdateFailed === 'string' ||
      typeof search.profileUpdateFailed === 'number'
        ? String(search.profileUpdateFailed)
        : undefined,
  }),
  component: OnboardingPage,
});

/**
 * 회원가입 직후 선호 장르와 플레이 파트를 선택하는 온보딩 페이지를 렌더링한다.
 */
function OnboardingPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { name, profileUpdateFailed } = Route.useSearch();
  const genreOptionsQuery = useGenreOptions();
  const partOptionsQuery = usePartOptions();
  const shouldShowProfileUpdateFailure = profileUpdateFailed === '1';

  /**
   * 온보딩 완료 또는 건너뛰기 후 홈으로 이동한다.
   */
  const handleComplete = async (result: OnboardingResult) => {
    const hasOnboardingResult =
      result.favoriteGenreIds.length > 0 || result.skillTypeIds.length > 0;

    try {
      if (hasOnboardingResult) {
        const userId = auth.user.id || 'user-001';
        await updateUserProfile(userId, {
          favoriteGenres: result.favoriteGenreIds,
          skills: result.skillTypeIds.map((skillTypeId, index) => ({
            skillTypeId,
            level: 'INTERMEDIATE',
            isPrimary: index === 0,
          })),
        });
      }
    } catch (error) {
      console.error('온보딩 결과 저장에 실패했습니다.', error);
    } finally {
      await navigate({ to: '/' });
    }
  };

  if (genreOptionsQuery.isLoading || partOptionsQuery.isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl items-center justify-center typo-base-m text-grey-200"
      >
        온보딩 정보를 불러오는 중입니다.
      </div>
    );
  }

  if (genreOptionsQuery.isError || partOptionsQuery.isError) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col items-center justify-center gap-5 text-center">
        <p className="typo-base-m text-grey-200">
          온보딩 정보를 불러오지 못했습니다.
        </p>
        <button
          type="button"
          className="rounded-full border border-key-muted px-6 py-3 typo-base-m text-grey-200"
          onClick={() => {
            void genreOptionsQuery.refetch();
            void partOptionsQuery.refetch();
          }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <>
      {shouldShowProfileUpdateFailure ? (
        <div
          role="status"
          aria-live="polite"
          className="mx-auto mb-6 w-full max-w-2xl rounded-2xl bg-destructive/10 px-5 py-4 text-center typo-sm-m text-destructive"
        >
          회원가입은 완료됐지만 프로필 저장에 실패했습니다. 온보딩에서 이어서
          설정해주세요.
        </div>
      ) : null}
      <OnboardingFlow
        userName={name}
        genres={genreOptionsQuery.data}
        parts={partOptionsQuery.data}
        onComplete={handleComplete}
      />
    </>
  );
}

import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import { requireLogin } from '@/app/router-guards';
import { useGenres } from '@/entities/genre/api/useGenres';
import { useSkillTypes } from '@/entities/skill/api/useSkillTypes';
import type { OnboardingOption } from '@/features/onboarding/model/onboarding-options';
import {
  OnboardingFlow,
  type OnboardingResult,
} from '@/features/onboarding/ui/OnboardingFlow';
import { updateUserProfile } from '@/features/profile-update/api/profile-api';
import { useAuth } from '@/app/providers/auth-context';

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
  const auth = useAuth();
  const { name } = Route.useSearch();
  // 장르·파트는 공용 목록(/common/*)을 쓰고, 온보딩 선택지 형태로만 옮긴다.
  const genreOptionsQuery = useGenres();
  const partOptionsQuery = useSkillTypes();

  const toOptions = (
    items: { id: string; name: string }[] | undefined,
  ): OnboardingOption[] | undefined =>
    items?.map(({ id, name }) => ({ id, label: name }));

  /**
   * 온보딩 완료 또는 건너뛰기 후 홈으로 이동한다.
   */
  const handleComplete = async (result: OnboardingResult) => {
    const hasOnboardingResult =
      result.favoriteGenreIds.length > 0 || result.skillTypeIds.length > 0;

    try {
      if (hasOnboardingResult) {
        const userId = auth.user.id;
        if (!userId) {
          throw new Error('User ID not found');
        }
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
      toast.error(
        '온보딩 정보를 저장하지 못했어요. 프로필에서 다시 설정할 수 있어요.',
      );
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
    <OnboardingFlow
      userName={name}
      genres={toOptions(genreOptionsQuery.data)}
      parts={toOptions(partOptionsQuery.data)}
      onComplete={handleComplete}
    />
  );
}

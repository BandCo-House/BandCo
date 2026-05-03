import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import {
  genreOptions,
  maxGenreSelections,
  partOptions,
  type OnboardingOption,
} from '../model/onboarding-options';

interface OnboardingFlowProps {
  userName?: string;
  genres?: OnboardingOption[];
  parts?: OnboardingOption[];
  onComplete: (result: OnboardingResult) => void;
}

type OnboardingStep = 'genre' | 'part';

export type OnboardingResult = {
  favoriteGenreIds: string[];
  skillTypeIds: string[];
};

/**
 * 선택 목록에서 특정 id를 토글하고 선택 순서를 유지한다.
 */
const toggleSelection = (
  selectedIds: string[],
  id: string,
  maxSelections?: number,
) => {
  if (selectedIds.includes(id)) {
    return selectedIds.filter((selectedId) => selectedId !== id);
  }

  if (maxSelections && selectedIds.length >= maxSelections) {
    return selectedIds;
  }

  return [...selectedIds, id];
};

/**
 * 회원가입 직후 사용자 선호 장르와 플레이 파트를 수집하는 온보딩 플로우를 렌더링한다.
 */
export const OnboardingFlow = ({
  userName = '밴코',
  genres = genreOptions,
  parts = partOptions,
  onComplete,
}: OnboardingFlowProps) => {
  const [step, setStep] = useState<OnboardingStep>('genre');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedParts, setSelectedParts] = useState<string[]>([]);

  const isGenreStep = step === 'genre';
  const currentOptions = isGenreStep ? genres : parts;
  const selectedIds = isGenreStep ? selectedGenres : selectedParts;
  const progressPercent = isGenreStep ? '50%' : '100%';
  const canProceed = selectedIds.length > 0;

  /**
   * 현재 단계의 선택 항목을 토글한다.
   */
  const handleOptionToggle = (id: string) => {
    if (isGenreStep) {
      setSelectedGenres((prev) =>
        toggleSelection(prev, id, maxGenreSelections),
      );
      return;
    }

    setSelectedParts((prev) => toggleSelection(prev, id));
  };

  /**
   * 다음 단계로 이동하거나 온보딩 완료 콜백을 호출한다.
   */
  const handlePrimaryAction = () => {
    if (isGenreStep) {
      setStep('part');
      return;
    }

    onComplete({
      favoriteGenreIds: selectedGenres,
      skillTypeIds: selectedParts,
    });
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-2xl flex-col text-grey-50">
      <div className="mb-14 h-1.5 w-full overflow-hidden rounded-full bg-overlay-24">
        <div
          className="h-full rounded-full bg-secondary transition-[width] duration-300"
          style={{ width: progressPercent }}
        />
      </div>

      <header className="mb-12">
        <h1 className="typo-2xl-b whitespace-pre-line text-grey-50">
          {isGenreStep
            ? `반가워요, ${userName}님\n어떤 음악을 추구하나요?`
            : `${userName}님이\n자신 있는 포지션은?`}
        </h1>
        <p className="mt-3 typo-base-m text-grey-200">
          {isGenreStep
            ? `선택한 순서대로 내 프로필에 적용됩니다. (최대 ${maxGenreSelections}개)`
            : '선택한 순서대로 내 프로필에 적용됩니다'}
        </p>
      </header>

      <section
        aria-label={isGenreStep ? '선호 장르 선택' : '포지션 선택'}
        className="flex flex-wrap gap-x-2.5 gap-y-3"
      >
        {currentOptions.map((option) => {
          const order = selectedIds.indexOf(option.id) + 1;
          const isSelected = order > 0;

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              className={cn(
                'relative min-h-12 rounded-full border-2 px-5 typo-base-m transition-colors focus-visible:outline-2 focus-visible:outline-secondary',
                isSelected
                  ? 'bg-secondary text-secondary-foreground'
                  : 'border-grey-300 bg-transparent text-grey-200 hover:border-secondary hover:text-grey-50',
              )}
              onClick={() => handleOptionToggle(option.id)}
            >
              {isSelected ? (
                <span className="absolute -top-2 -left-1 flex size-6 items-center justify-center rounded-full border-2 border-secondary bg-grey-50 typo-base-b text-primary-dark">
                  {order}
                </span>
              ) : null}
              {option.label}
            </button>
          );
        })}
      </section>

      <footer className="mt-auto pt-16">
        <p className="mb-8 text-center typo-sm-m text-grey-200">
          {isGenreStep
            ? '선호 장르는 나중에 다시 수정할 수 있어요!'
            : '포지션은 나중에 다시 수정할 수 있어요!'}
        </p>

        {isGenreStep ? (
          <div className="flex flex-col gap-8">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled={!canProceed}
              className="w-full typo-xl-sb"
              onClick={handlePrimaryAction}
            >
              다음
            </Button>
            <button
              type="button"
              className="mx-auto typo-base-m text-grey-200 underline underline-offset-4 transition-colors hover:text-grey-50 focus-visible:outline-2 focus-visible:outline-secondary"
              onClick={() =>
                onComplete({
                  favoriteGenreIds: [],
                  skillTypeIds: [],
                })
              }
            >
              나중에 할게요
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => setStep('genre')}
            >
              이전
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled={!canProceed}
              onClick={handlePrimaryAction}
            >
              시작하기
            </Button>
          </div>
        )}
      </footer>
    </div>
  );
};

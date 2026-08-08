import { Button } from '@/shared/ui/button';

interface ScheduleActionBarProps {
  /** 왼쪽 아웃라인 버튼(취소 · 수정). */
  secondaryLabel: string;
  onSecondary: () => void;
  /** 오른쪽 shining 버튼(추가 · 확인). */
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
}

/**
 * 5개 디자인 공통 하단 액션바. 왼쪽=흰 테두리 아웃라인, 오른쪽=shining(primary).
 * 풀스크린 시트의 스크롤 본문 밖(푸터)에 두어 shining 글로우가 잘리지 않게 한다.
 */
export const ScheduleActionBar = ({
  secondaryLabel,
  onSecondary,
  primaryLabel,
  onPrimary,
  primaryDisabled,
  primaryLoading,
}: ScheduleActionBarProps) => (
  <div className="flex items-center justify-end gap-3 bg-gradient-top/65 px-5 py-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] footer-glow backdrop-blur-sm">
    <Button
      type="button"
      variant="outline"
      size="pill"
      className="border-grey-50 typo-base-b text-grey-50"
      onClick={onSecondary}
    >
      {secondaryLabel}
    </Button>
    <Button
      type="button"
      variant="shining"
      size="pill"
      className="typo-base-sb"
      disabled={primaryDisabled}
      isLoading={primaryLoading}
      onClick={onPrimary}
    >
      {primaryLabel}
    </Button>
  </div>
);

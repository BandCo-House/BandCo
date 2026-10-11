import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

// 가운데 선택 줄을 은은하게 강조하는 마스크(위아래 페이드).
const WHEEL_MASK =
  'linear-gradient(to bottom, transparent, #000 18%, #000 82%, transparent)';

interface WheelRowProps {
  /**
   * 이 줄이 무엇을 고르는지(예: 날짜·시작·종료). 휠 왼쪽에 그리고 group 이름으로도 쓴다.
   * 같은 모양의 휠이 여러 줄 쌓이면 순서를 문장으로 설명하는 것보다 줄마다 이름을
   * 붙이는 쪽이 바로 읽힌다.
   */
  label?: string;
  /** 라벨을 화면에 그리지 않고 group 이름으로만 남긴다. 휠이 한 줄뿐이라 구분이 필요 없을 때. */
  labelHidden?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * 휠 컬럼 묶음 한 줄(날짜·시간 피커의 공통 뼈대): 왼쪽 라벨 + 마스크를 씌운 휠.
 *
 * 라벨은 마스크 밖에 둔다 — 안에 넣으면 위아래 페이드에 묻힌다.
 * 폭이 모자라면(약 340px 미만 화면) 휠을 줄이지 않고 라벨 아래 줄로 내린다.
 * 휠 컬럼은 폭이 고정이라 줄어들 수 없고, 억지로 한 줄에 두면 카드 밖으로 넘친다.
 */
export const WheelRow = ({
  label,
  labelHidden = false,
  className,
  children,
}: WheelRowProps) => (
  <div
    role={label ? 'group' : undefined}
    aria-label={label}
    className={cn('flex flex-wrap items-center gap-x-2 gap-y-1', className)}
  >
    {label && !labelHidden && (
      <span aria-hidden="true" className="shrink-0 typo-sm-sb text-grey-200">
        {label}
      </span>
    )}
    <div
      className="flex flex-1 items-center justify-center"
      style={{ maskImage: WHEEL_MASK, WebkitMaskImage: WHEEL_MASK }}
    >
      {children}
    </div>
  </div>
);

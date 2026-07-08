import { useMemo } from 'react';

interface UseScheduleLayoutProps {
  /** 윈도 시작 기준 분(0 = 타임라인 맨 위). */
  startMin: number;
  endMin: number;
  slotHeight: number;
  /** 상단 패딩(px). 0시/시작 라벨이 잘리지 않도록 카드도 같이 내린다. */
  topOffset?: number;
}

// 끝을 살짝 잘라 다음 일정과 붙지 않게 한다(긴 일정 5분, 짧은 일정 2분).
const TRIM_LONG_MIN = 5;
const TRIM_SHORT_MIN = 2;
const SHORT_THRESHOLD_MIN = 10;
// 시간 비례 높이의 하한(0 방지용). 실제 최소 높이는 카드 내용(제목)이 flex로 결정한다.
const MIN_VISIBLE_MIN = 1;

/**
 * 윈도 상대 분(startMin/endMin)으로 카드의 top/height를 계산한다.
 * height는 끝을 약간 잘라 인접 일정과 시각적으로 겹치지 않게 한다.
 */
export const useScheduleLayout = ({
  startMin,
  endMin,
  slotHeight,
  topOffset = 0,
}: UseScheduleLayoutProps) => {
  return useMemo(() => {
    const durationMin = endMin - startMin;
    const trimMin =
      durationMin <= SHORT_THRESHOLD_MIN ? TRIM_SHORT_MIN : TRIM_LONG_MIN;
    const visibleMin = Math.max(durationMin - trimMin, MIN_VISIBLE_MIN);

    const top = (startMin / 60) * slotHeight + topOffset;
    const height = (visibleMin / 60) * slotHeight;

    return { top, height };
  }, [startMin, endMin, slotHeight, topOffset]);
};

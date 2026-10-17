import AddMiniIcon from '@/assets/icons/add-mini.svg?react';
import { formatLocalDate, isSameDay } from '@/shared/lib/date';
import { MonthGrid } from './month-grid';

// 점은 최대 3개. 그보다 많으면 점 2개 뒤에 '+'를 붙여 "더 있음"을 알린다.
const MAX_MARKER_DOTS = 3;

interface MonthDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  /** 날짜 키('YYYY-MM-DD') → 그날의 항목 수. 날짜 아래에 점으로 표시한다. */
  markers?: ReadonlyMap<string, number>;
  /** 스크린리더가 점의 뜻을 읽을 때 쓰는 단위(예: '일정'). */
  markerLabel?: string;
  className?: string;
}

const MarkerDots = ({ count }: { count: number }) => {
  const hasMore = count > MAX_MARKER_DOTS;
  const dotCount = hasMore ? MAX_MARKER_DOTS - 1 : count;
  return (
    <>
      {Array.from({ length: dotCount }, (_, dot) => (
        <span key={dot} className="size-1 rounded-full bg-primary" />
      ))}
      {hasMore && <AddMiniIcon className="size-1 text-grey-50" />}
    </>
  );
};

/**
 * 한 달을 그리드로 보여주고 하루를 고르는 날짜 선택기. WeekDateStrip의 월 단위 짝이다.
 * 여러 날짜를 고르는 MonthCalendar와 달리 값이 하나이고, 달 이동·제목은 사용처가 맡는다.
 * 격자의 생김새는 둘이 MonthGrid를 같이 쓴다.
 */
export const MonthDatePicker = ({
  value,
  onChange,
  markers,
  markerLabel = '항목',
  className,
}: MonthDatePickerProps) => (
  <MonthGrid
    className={className}
    year={value.getFullYear()}
    month={value.getMonth()}
    showMarkers
    onSelect={onChange}
    getDay={(date) => {
      const count = markers?.get(formatLocalDate(date)) ?? 0;
      return {
        isSelected: isSameDay(date, value),
        marker: count > 0 ? <MarkerDots count={count} /> : undefined,
        labelSuffix: count > 0 ? `${markerLabel} ${count}개` : undefined,
      };
    }}
  />
);

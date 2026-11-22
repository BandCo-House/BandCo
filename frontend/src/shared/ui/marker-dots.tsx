import AddMiniIcon from '@/assets/icons/add-mini.svg?react';

// 점은 최대 3개. 그보다 많으면 점 2개 뒤에 '+'를 붙여 "더 있음"을 알린다.
const MAX_MARKER_DOTS = 3;

/** 날짜 아래에 그 날의 항목 수를 점으로 보여준다. 월·주 날짜 선택기가 같이 쓴다. */
export const MarkerDots = ({ count }: { count: number }) => {
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

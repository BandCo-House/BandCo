import { type DayScheduleBlock } from './day-window';

/**
 * 두 블록이 시간상 겹치는지 확인합니다.
 */
const isOverlapping = (a: DayScheduleBlock, b: DayScheduleBlock) =>
  a.startMin < b.endMin && b.startMin < a.endMin;

/**
 * 겹치는 일정에 컬럼(가로 위치)을 배정합니다.
 * 추가된(배열) 순서대로 왼쪽부터 채우고, 이미 같은 시간대를 차지한 일정이 있으면
 * 다음 컬럼으로 밀어 표현합니다. totalColumns는 그 일정과 겹치는 최대 동시 컬럼 수입니다.
 */
export const calculateOverlaps = (
  blocks: DayScheduleBlock[],
): DayScheduleBlock[] => {
  const placed: DayScheduleBlock[] = [];

  for (const block of blocks) {
    const usedColumns = new Set(
      placed
        .filter((other) => isOverlapping(other, block))
        .map((other) => other.column ?? 0),
    );

    let column = 0;
    while (usedColumns.has(column)) column += 1;
    block.column = column;
    placed.push(block);
  }

  return placed.map((block) => {
    const columns = placed
      .filter((other) => isOverlapping(other, block))
      .map((other) => other.column ?? 0);

    return { ...block, totalColumns: Math.max(...columns) + 1 };
  });
};

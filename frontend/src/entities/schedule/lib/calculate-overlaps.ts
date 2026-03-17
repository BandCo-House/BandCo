import { type SchedulePart } from './split-schedule';

/**
 * 시간(HH:mm)을 분 단위 숫자로 변환합니다.
 */
const timeToMinutes = (time: string) => {
  if (time === '24:00') return 24 * 60;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/**
 * 두 일정이 겹치는지 확인합니다.
 */
const isOverlapping = (a: SchedulePart, b: SchedulePart) => {
  const aStart = timeToMinutes(a.startTime);
  const aEnd = timeToMinutes(a.endTime);
  const bStart = timeToMinutes(b.startTime);
  const bEnd = timeToMinutes(b.endTime);

  return aStart < bEnd && bStart < aEnd;
};

/**
 * 동일한 날짜의 일정들 사이의 겹침을 계산하여 레이아웃 정보를 부여합니다.
 */
export const calculateOverlaps = (parts: SchedulePart[]): SchedulePart[] => {
  if (parts.length === 0) return [];

  // 1. 시작 시간순 정렬
  const sorted = [...parts].sort(
    (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime),
  );

  const results: SchedulePart[] = [];
  let currentGroup: SchedulePart[] = [];
  let groupMaxEnd = 0;

  // 2. 겹치는 일정들을 그룹(Cluster)으로 묶기
  for (const part of sorted) {
    const start = timeToMinutes(part.startTime);
    const end = timeToMinutes(part.endTime);

    if (currentGroup.length > 0 && start >= groupMaxEnd) {
      // 새로운 그룹 시작 전, 이전 그룹의 컬럼 배정 처리
      processGroup(currentGroup, results);
      currentGroup = [];
      groupMaxEnd = 0;
    }

    currentGroup.push(part);
    groupMaxEnd = Math.max(groupMaxEnd, end);
  }

  if (currentGroup.length > 0) {
    processGroup(currentGroup, results);
  }

  return results;
};

/**
 * 한 그룹(Cluster) 내에서 각 일정의 열(Column)을 배정합니다.
 */
function processGroup(group: SchedulePart[], results: SchedulePart[]) {
  const columns: SchedulePart[][] = [];

  for (const part of group) {
    let placed = false;

    // 각 열을 확인하며 겹치지 않는 첫 번째 열에 배정
    for (let i = 0; i < columns.length; i++) {
      const lastInCol = columns[i][columns[i].length - 1];
      if (!isOverlapping(lastInCol, part)) {
        columns[i].push(part);
        part.column = i;
        placed = true;
        break;
      }
    }

    // 모든 기존 열과 겹치면 새로운 열 생성
    if (!placed) {
      part.column = columns.length;
      columns.push([part]);
    }
  }

  // 전체 열 개수(totalColumns)를 그룹 내 모든 일정에 부여
  for (const part of group) {
    part.totalColumns = columns.length;
    results.push(part);
  }
}

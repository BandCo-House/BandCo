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
 * 한 그룹(Cluster) 내에서 각 일정의 열(Column)을 배정하고 최적 너비를 계산합니다.
 */
function processGroup(group: SchedulePart[], results: SchedulePart[]) {
  const columns: SchedulePart[][] = [];

  // 1. 그리디 컬럼 배정
  for (const part of group) {
    let placed = false;
    for (let i = 0; i < columns.length; i++) {
      const lastInCol = columns[i][columns[i].length - 1];
      if (!isOverlapping(lastInCol, part)) {
        columns[i].push(part);
        part.column = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      part.column = columns.length;
      columns.push([part]);
    }
  }

  // 2. 각 일정별로 자신의 시간대에 겹치는 최대 컬럼 수 계산 (지능형 너비)
  for (const part of group) {
    // 일정의 시작부터 끝까지 매 분(또는 주요 시점)마다 겹치는 컬럼 수를 체크할 수 있으나,
    // 성능을 위해 그룹 내 다른 일정들과의 교차 여부로 계산
    const overlappingParts = group.filter((other) =>
      isOverlapping(part, other),
    );
    const usedColumns = new Set(overlappingParts.map((p) => p.column));

    // 이 일정이 속한 시간대에 활성화된 최대 컬럼 인덱스 + 1
    part.totalColumns = Math.max(...Array.from(usedColumns as Set<number>)) + 1;
    results.push(part);
  }
}

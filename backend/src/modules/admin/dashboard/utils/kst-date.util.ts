/**
 * 대시보드의 "오늘/일자"는 KST 기준이다.
 * Asia/Seoul은 서머타임 없이 항상 UTC+9라 고정 오프셋으로 계산해도 정확하다.
 */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 시각을 KST 달력 날짜 문자열로 바꾼다.
 *
 * @param {Date} instant - 변환할 시각
 * @returns {string} KST 기준 'YYYY-MM-DD'
 */
export function toKstDateString(instant: Date): string {
  const shiftedToKst = new Date(instant.getTime() + KST_OFFSET_MS);
  return shiftedToKst.toISOString().slice(0, 10);
}

/**
 * KST 날짜의 00:00 시각을 구한다. 기간 조회의 경계(이상/미만)로 쓴다.
 *
 * @param {string} dateString - 'YYYY-MM-DD' (KST)
 * @returns {Date} 그 날 KST 00:00에 해당하는 시각
 */
export function getKstDayStart(dateString: string): Date {
  const utcMidnight = Date.parse(`${dateString}T00:00:00.000Z`);
  return new Date(utcMidnight - KST_OFFSET_MS);
}

/**
 * 날짜 문자열에 일수를 더한다. 시각이 아닌 달력 날짜끼리의 계산이라 UTC 기준으로 더해도 안전하다.
 *
 * @param {string} dateString - 'YYYY-MM-DD'
 * @param {number} days - 더할 일수(음수면 과거)
 * @returns {string} 계산된 'YYYY-MM-DD'
 */
export function addDaysToDateString(dateString: string, days: number): string {
  const utcMidnight = Date.parse(`${dateString}T00:00:00.000Z`);
  return new Date(utcMidnight + days * DAY_MS).toISOString().slice(0, 10);
}

/**
 * 두 날짜 사이의 일수를 양 끝 포함으로 센다. from이 to보다 늦으면 0 이하가 된다.
 *
 * @param {string} from - 시작일 'YYYY-MM-DD'
 * @param {string} to - 종료일 'YYYY-MM-DD'
 * @returns {number} 양 끝을 포함한 일수
 */
export function countDaysInclusive(from: string, to: string): number {
  const fromUtcMidnight = Date.parse(`${from}T00:00:00.000Z`);
  const toUtcMidnight = Date.parse(`${to}T00:00:00.000Z`);
  return (toUtcMidnight - fromUtcMidnight) / DAY_MS + 1;
}

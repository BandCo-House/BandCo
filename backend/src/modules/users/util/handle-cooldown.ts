/** 고유 ID를 바꾼 뒤 다시 바꿀 수 있을 때까지의 대기 시간(7일) */
export const HANDLE_CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * 마지막 변경 시각으로 다음 변경 가능 시각을 구한다.
 * 쿨다운 기준 시각이 없거나(처음 설정 직후 포함) 쿨다운이 끝났으면 지금 바로 바꿀 수 있으므로 null이다.
 *
 * @param {Date | null} handleChangedAt - 쿨다운 기준 시각
 * @param {Date} now - 판정 기준 시각
 * @returns {Date | null} 아직 바꿀 수 없으면 다음 변경 가능 시각, 바꿀 수 있으면 null
 */
export function getHandleChangeableAt(handleChangedAt: Date | null, now: Date): Date | null {
  if (handleChangedAt === null) {
    return null;
  }

  const changeableAt = new Date(handleChangedAt.getTime() + HANDLE_CHANGE_COOLDOWN_MS);
  const isCoolingDown = changeableAt.getTime() > now.getTime();

  if (!isCoolingDown) {
    return null;
  }

  return changeableAt;
}

/** #71 고유 ID 중복 확인 응답 */
export interface HandleAvailabilityResult {
  handle: string;
  available: boolean;
}

/** #72 고유 ID 변경 응답 */
export interface ChangeHandleResult {
  userId: string;
  handle: string;
  /** 쿨다운 기준 시각. 처음 설정은 기록하지 않아 null이다 */
  handleChangedAt: string | null;
  /** 다음 변경 가능 시각. 쿨다운 중이 아니면(처음 설정 직후 포함) null */
  handleChangeableAt: string | null;
}

/** 쿨다운 판정에 필요한 현재 고유 ID 상태 */
export interface HandleState {
  handle: string | null;
  handleChangedAt: Date | null;
}

/** 고유 ID 저장 입력. currentHandle은 낙관적 잠금용이라, 읽은 뒤 다른 요청이 먼저 바꿨으면 저장하지 않는다 */
export interface UpdateHandleInput {
  currentHandle: string | null;
  newHandle: string;
  /** 처음 설정이면 null(쿨다운에 세지 않음), 그 외에는 변경 시각 */
  changedAt: Date | null;
}

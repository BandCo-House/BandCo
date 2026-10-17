/**
 * 서버가 인증 정보로부터 직접 결정한 조회 범위.
 * LLM 출력에는 이 값이 들어갈 자리가 없고, 조회 직전에 서버가 결합한다.
 */
export interface AssistantScope {
  userId: string;
  bandId: string;
  bandMemberId: string;
}

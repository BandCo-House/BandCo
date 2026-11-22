/**
 * 닉네임만으로는 동명이인이 갈리지 않는 자리(선택 칩의 해제 버튼 등)에 쓰는 이름.
 * 고유 ID를 아직 정하지 않은 유저는 닉네임만 쓴다.
 */
export const formatUserLabel = (
  nickname: string,
  handle: string | null,
): string => (handle ? `${nickname}(${handle})` : nickname);

/**
 * 초대코드 입력값에서 실제 코드를 뽑아낸다.
 * 공유되는 건 `…/invite/{code}` 형태의 링크라, 사용자가 코드 대신
 * 링크 전체를 붙여넣는 경우가 흔하다. 그 경우 마지막 `/invite/` 뒤 조각을 코드로 쓴다.
 */
export const extractInviteCode = (input: string): string => {
  const trimmed = input.trim();
  const marker = '/invite/';
  const markerIndex = trimmed.lastIndexOf(marker);
  if (markerIndex === -1) return trimmed;

  const afterMarker = trimmed.slice(markerIndex + marker.length);
  // 뒤에 붙은 경로·쿼리·해시는 코드가 아니다.
  return afterMarker.split(/[/?#]/, 1)[0].trim();
};

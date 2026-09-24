/**
 * 초대코드 입력값에서 실제 코드를 뽑아낸다.
 * 공유되는 건 `…/invite/{code}` 형태의 링크라, 사용자가 코드 대신
 * 링크 전체를 붙여넣는 경우가 흔하다. 그 경우 마지막 `/invite/` 뒤 조각을 코드로 쓴다.
 */
export const extractInviteCode = (input: string): string => {
  const trimmed = input.trim();
  const marker = '/invite/';

  // 절대 URL이면 pathname에서만 찾는다. 쿼리에 다른 /invite/가 섞여 있어도
  // (예: ?next=/invite/OTHER) 경로의 코드가 사용자가 의도한 코드다.
  let target = trimmed;
  try {
    target = new URL(trimmed).pathname;
  } catch {
    // URL이 아니면(코드만 입력, scheme 없는 주소 등) 원문에서 찾는다.
  }

  const markerIndex = target.indexOf(marker);
  if (markerIndex === -1) return trimmed;

  const afterMarker = target.slice(markerIndex + marker.length);
  // 뒤에 붙은 경로·쿼리·해시는 코드가 아니다.
  return afterMarker.split(/[/?#]/, 1)[0].trim();
};

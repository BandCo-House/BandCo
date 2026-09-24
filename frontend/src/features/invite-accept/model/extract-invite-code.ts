/**
 * 초대코드 입력값에서 실제 코드를 뽑아낸다.
 * 공유되는 건 `…/invite/{code}` 형태의 링크라, 사용자가 코드 대신
 * 링크 전체를 붙여넣는 경우가 흔하다. 그 경우 경로의 `/invite/` 뒤 조각을 코드로 쓴다.
 */
export const extractInviteCode = (input: string): string => {
  const trimmed = input.trim();
  const marker = '/invite/';

  // pathname에서만 찾는다. 쿼리에 다른 /invite/가 섞여 있어도
  // (예: ?next=/invite/OTHER) 경로의 코드가 사용자가 의도한 코드다.
  // scheme 없는 주소도 base를 붙여 파싱하면 쿼리·해시가 pathname에서 분리된다.
  let target: string;
  try {
    target = new URL(trimmed).pathname;
  } catch {
    try {
      target = new URL(trimmed, 'https://placeholder.invalid').pathname;
    } catch {
      target = trimmed;
    }
  }

  const markerIndex = target.indexOf(marker);
  if (markerIndex === -1) return trimmed;

  const afterMarker = target.slice(markerIndex + marker.length);
  // 뒤에 붙은 경로·쿼리·해시는 코드가 아니다.
  const code = afterMarker.split(/[/?#]/, 1)[0].trim();
  // '…/invite/'처럼 잘린 링크에서 빈 코드를 뽑으면 //join 요청이 나간다. 원문을 돌려줘
  // 서버 검증(404)에 원래 입력이 그대로 실리게 한다.
  return code || trimmed;
};

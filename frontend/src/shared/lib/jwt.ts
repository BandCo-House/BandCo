/**
 * JWT Access Token에서 유저 ID를 파싱합니다.
 * 토큰이 유효하지 않거나 id 필드가 없으면 null을 반환합니다.
 */
export const getUserIdFromToken = (token: string | null): string | null => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      '=',
    );
    const jsonPayload = decodeURIComponent(
      window
        .atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const payload = JSON.parse(jsonPayload) as { id?: unknown };
    return typeof payload.id === 'string' ? payload.id : null;
  } catch {
    return null;
  }
};

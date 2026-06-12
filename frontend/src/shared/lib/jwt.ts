interface JwtPayload {
  id?: string;
  exp?: number;
  [key: string]: unknown;
}

export const decodeToken = (token: string | null): JwtPayload | null => {
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
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
};

export const getUserIdFromToken = (token: string | null): string | null => {
  const payload = decodeToken(token);
  return payload && typeof payload.id === 'string' ? payload.id : null;
};

export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;
  const payload = decodeToken(token);
  if (!payload) return true;
  if (payload.exp === undefined || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 < Date.now();
};


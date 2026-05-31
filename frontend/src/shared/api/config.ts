export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : '');

export const API_TIMEOUT = 10_000;

export const ACCESS_TOKEN_REFRESH_ENDPOINT = '/auth/token/access';

export const REFRESH_TOKEN_REFRESH_ENDPOINT = '/auth/token/refresh';

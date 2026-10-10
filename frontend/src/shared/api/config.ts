export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : '');

export const API_TIMEOUT = 10_000;

export const ACCESS_TOKEN_REFRESH_ENDPOINT = '/auth/token/access';

export const REFRESH_TOKEN_REFRESH_ENDPOINT = '/auth/token/refresh';

// Google OAuth 클라이언트 ID는 공개값이며 로컬·운영 모두 같은 클라이언트(승인된 원본에 등록)를 쓴다.
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '249941930834-a9800i1uti9nhgqfeivs8b9lv0mqboip.apps.googleusercontent.com';

// 카카오맵 JavaScript 키. 카카오 디벨로퍼스에 등록한 도메인에서만 동작하는 공개값이다.
// 비어 있으면 장소 검색 진입점을 숨긴다(shared/lib/kakao-maps.ts).
export const KAKAO_MAP_APP_KEY = import.meta.env.VITE_KAKAO_MAP_KEY || '';

// 로그인 요청의 401은 자격 증명 오류라 토큰 갱신 대상이 아니다. 응답 인터셉터가 이 prefix로 구분한다.
export const LOGIN_ENDPOINT_PREFIX = '/auth/login/';

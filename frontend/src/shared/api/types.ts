/** 백엔드 `ApiError`와 같은 형태. `details.statusCode`에 HTTP 상태가 담긴다. */
export interface ApiErrorDetails {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ApiError {
  code: string;
  details?: ApiErrorDetails;
}

/** 백엔드 `ApiSuccessResponse<T>`와 같은 형태. 모든 2xx 응답은 이 봉투로 온다. */
export interface ApiSuccessResponse<T> {
  status: 'success';
  error: null;
  message: string;
  data: T;
}

/** 백엔드 `ApiFailResponse`와 같은 형태. 4xx·5xx 응답은 이 봉투로 온다. */
export interface ApiFailResponse {
  status: 'fail';
  error: ApiError;
  message: string;
  data: Record<string, never>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiFailResponse;

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

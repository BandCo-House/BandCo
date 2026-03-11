export interface ApiErrorDetails {
  [key: string]: string | number | boolean | null | undefined;
}

export interface ApiError {
  code: string;
  details?: ApiErrorDetails;
}

export interface ApiSuccessResponse<T> {
  status: 'success';
  error: null;
  message: string;
  data: T;
}

export interface ApiFailResponse {
  status: 'fail';
  error: ApiError;
  message: string;
  data: Record<string, never>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiFailResponse;

/**
 * 성공 응답 형식을 문서 기준으로 고정한다.
 *
 * @param message 클라이언트에 전달할 성공 메시지
 * @param data 실제 응답 데이터
 * @returns 공통 성공 응답 객체
 */
export function createSuccessResponse<T>(message: string, data: T): ApiSuccessResponse<T> {
  return {
    status: 'success',
    error: null,
    message,
    data,
  };
}

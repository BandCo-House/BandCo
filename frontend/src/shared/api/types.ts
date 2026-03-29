export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: ApiError | null;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

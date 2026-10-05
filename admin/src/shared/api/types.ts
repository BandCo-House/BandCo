/** 백엔드 성공 봉투. 모든 2xx 응답은 이 형태로 온다. */
export interface ApiSuccessResponse<T> {
  status: 'success';
  error: null;
  message: string;
  data: T;
}

/** 백엔드 실패 봉투. 4xx·5xx 응답은 이 형태로 온다. */
export interface ApiFailResponse {
  status: 'fail';
  error: { code: string };
  message: string;
  data: Record<string, never>;
}

export interface Pagination {
  page: number;
  size: number;
  totalCount: number;
  hasNext: boolean;
}

/** 오프셋 페이지네이션 목록 응답 */
export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface PageQuery {
  page?: number;
  size?: number;
}

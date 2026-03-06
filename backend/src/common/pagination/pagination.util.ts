export interface PaginationParams {
  page: number;
  size: number;
}

export interface PaginationResult {
  page: number;
  size: number;
  totalCount: number;
  hasNext: boolean;
}

/**
 * 목록 조회 응답에서 공통으로 쓰는 페이지네이션 메타데이터를 계산한다.
 *
 * @param totalCount 필터링과 정렬이 끝난 전체 데이터 수
 * @param params 요청에서 전달받은 페이지 정보
 * @returns 응답에 그대로 담을 수 있는 페이지네이션 메타데이터
 */
export function createPagination(totalCount: number, params: PaginationParams): PaginationResult {
  const totalPageCount = Math.ceil(totalCount / params.size);
  const hasNext = params.page < totalPageCount;

  return {
    page: params.page,
    size: params.size,
    totalCount,
    hasNext,
  };
}

/**
 * 페이지 정보에 맞게 현재 페이지에 해당하는 데이터만 잘라낸다.
 *
 * @param items 전체 목록 또는 필터링된 목록
 * @param params 요청에서 전달받은 페이지 정보
 * @returns 현재 페이지에 노출할 데이터 목록
 */
export function paginateItems<T>(items: T[], params: PaginationParams): T[] {
  const startIndex = (params.page - 1) * params.size;
  const endIndex = startIndex + params.size;

  return items.slice(startIndex, endIndex);
}

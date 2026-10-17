import { createPagination, type PaginationParams, type PaginationResult } from 'src/common/pagination';

/** 어드민 목록 API 공통 응답 형식 */
export type AdminPaginatedResult<T> = {
  items: T[];
  pagination: PaginationResult;
};

/**
 * 조회한 한 페이지 분량과 전체 개수로 어드민 목록 응답을 만든다.
 *
 * @param items 현재 페이지 항목
 * @param totalCount 필터를 적용한 전체 개수
 * @param params 요청 페이지 정보
 * @returns 어드민 목록 응답
 */
export function toAdminPaginatedResult<T>(items: T[], totalCount: number, params: PaginationParams): AdminPaginatedResult<T> {
  return { items, pagination: createPagination(totalCount, params) };
}

/** Prisma skip/take로 바꾼 페이지 정보 */
export function toSkipTake(params: PaginationParams): { skip: number; take: number } {
  return { skip: (params.page - 1) * params.size, take: params.size };
}

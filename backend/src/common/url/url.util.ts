/**
 * 커서 기반 목록 조회의 다음 페이지 경로를 생성한다.
 * undefined / null 값은 쿼리 파라미터에서 제외된다.
 *
 * @param basePath - 기본 경로 (예: /notifications/me)
 * @param params - 쿼리 파라미터 객체
 * @returns 쿼리 파라미터가 포함된 경로 문자열
 */
export function buildNextPath(basePath: string, params: Record<string, string | number | boolean | null | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  }
  return `${basePath}?${searchParams.toString()}`;
}

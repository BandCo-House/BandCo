export interface LoggedRequest {
  method: string;
  baseUrl: string;
  route?: { path: unknown };
  user?: { id: string };
}

/** 라우트 템플릿을 써서 경로의 사용자 입력값과 쿼리 문자열이 로그에 남지 않게 한다. */
export function getRequestPath(request: LoggedRequest): string {
  const routePath = request.route?.path;
  if (typeof routePath !== 'string') {
    return '<unmatched>';
  }

  return `${request.baseUrl}${routePath}`;
}

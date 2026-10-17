export interface LoggedRequest {
  method: string;
  baseUrl: string;
  path?: string;
  route?: { path: unknown };
  user?: { id: string };
}

const UUID_SEGMENT = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const SENSITIVE_SEGMENT = /^(auth|code|confirm|invite|key|password|reset|secret|session|token|verify)$/i;

/** 등록된 경로는 템플릿을, 미등록 경로는 식별자를 가린 경로만 남긴다. */
export function getRequestPath(request: LoggedRequest): string {
  const routePath = request.route?.path;
  if (typeof routePath === 'string') {
    return `${request.baseUrl}${routePath}`;
  }

  if (typeof request.path !== 'string') {
    return '<unmatched>';
  }

  const pathname = request.path.split(/[?#]/, 1)[0];
  if (!pathname.startsWith('/')) {
    return '<unmatched>';
  }

  const segments = pathname.split('/');
  const sanitizedPath = segments
    .map((segment, index) => {
      if (
        UUID_SEGMENT.test(segment) ||
        /^\d+$/.test(segment) ||
        segment.length > 20 ||
        /[%@=]|\p{Cc}/u.test(segment) ||
        SENSITIVE_SEGMENT.test(segments[index - 1] ?? '')
      ) {
        return ':value';
      }
      return segment;
    })
    .join('/');

  return sanitizedPath.length <= 200 ? sanitizedPath : '<unmatched:long-path>';
}

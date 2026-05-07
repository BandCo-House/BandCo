type ClientErrorContext = {
  message: string;
  source: string;
};

declare global {
  interface Window {
    BandCoErrorReporter?: {
      captureException: (error: unknown, context: ClientErrorContext) => void;
    };
  }
}

/**
 * 클라이언트 오류를 프로덕션 모니터링 연동 지점으로 전달한다.
 * 실제 SDK가 주입되지 않은 개발 환경에서는 콘솔로 폴백한다.
 */
export const reportClientError = (
  error: unknown,
  context: ClientErrorContext,
) => {
  if (typeof window !== 'undefined' && window.BandCoErrorReporter) {
    window.BandCoErrorReporter.captureException(error, context);
    return;
  }

  console.error(context.message, error);
};

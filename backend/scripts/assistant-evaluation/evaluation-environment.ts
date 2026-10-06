/** 합성 실험이 앱의 개발 DB를 잘못 사용하지 않도록 별도 로컬 URL만 받는다. */
export function readEvaluationDatabaseUrl(raw: string | undefined): string {
  if (!raw) throw new Error('ASSISTANT_EVALUATION_DATABASE_URL가 필요합니다.');
  const url = new URL(raw);
  const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  const isEvaluationDatabase = url.pathname === '/bandco_assistant_evaluation';
  if (!isLocal || !isEvaluationDatabase || !['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error('전용 로컬 bandco_assistant_evaluation DB만 사용할 수 있습니다.');
  }
  return raw;
}

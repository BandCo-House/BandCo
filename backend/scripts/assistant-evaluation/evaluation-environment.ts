import { realpathSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';

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

/** 결과는 저장소 밖에 보관한다. 내부로 연결되는 심볼릭 링크도 거부한다. */
export function readEvaluationOutputPath(raw: string | undefined, repositoryRoot: string): string {
  if (!raw || !isAbsolute(raw)) throw new Error('EXPERIMENT_OUTPUT_PATH에는 저장소 밖 절대 경로가 필요합니다.');
  const outputPath = resolve(raw);
  const parent = realpathSync(dirname(outputPath));
  const project = realpathSync(repositoryRoot);
  const parentRelative = relative(project, parent);
  if (parentRelative === '' || (!parentRelative.startsWith(`..${sep}`) && parentRelative !== '..' && !isAbsolute(parentRelative))) {
    throw new Error('평가 결과를 Git 저장소 내부에 저장할 수 없습니다.');
  }
  return outputPath;
}

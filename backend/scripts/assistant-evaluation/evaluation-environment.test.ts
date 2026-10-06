import assert from 'node:assert/strict';
import { test } from 'node:test';

import { readEvaluationDatabaseUrl } from './evaluation-environment';

test('전용 로컬 실험 DB를 허용한다', () => {
  const url = 'postgresql://postgres:example@127.0.0.1:55432/bandco_assistant_evaluation';
  assert.equal(readEvaluationDatabaseUrl(url), url);
});

test('원격·앱 DB·누락 설정을 거부한다', () => {
  for (const url of [
    undefined,
    'postgresql://example.com/bandco_assistant_evaluation',
    'postgresql://localhost/bandco',
    'https://localhost/bandco_assistant_evaluation',
  ]) {
    assert.throws(() => readEvaluationDatabaseUrl(url));
  }
});

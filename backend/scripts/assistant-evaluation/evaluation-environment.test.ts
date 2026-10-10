import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mkdtempSync, mkdirSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { readEvaluationDatabaseUrl, readEvaluationOutputPath } from './evaluation-environment';

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

test('결과는 외부 절대 경로만 허용하고 내부 경로와 심볼릭 링크 우회를 거부한다', () => {
  const root = mkdtempSync(join(tmpdir(), 'assistant-output-'));
  const project = join(root, 'project');
  const external = join(root, 'records');
  mkdirSync(project);
  mkdirSync(external);
  symlinkSync(project, join(external, 'linked-project'));
  try {
    assert.equal(readEvaluationOutputPath(join(external, 'result.json'), project), join(external, 'result.json'));
    for (const value of [undefined, 'result.json', join(project, 'result.json'), join(external, 'linked-project', 'result.json')]) {
      assert.throws(() => readEvaluationOutputPath(value, project));
    }
  } finally {
    rmSync(root, { recursive: true });
  }
});

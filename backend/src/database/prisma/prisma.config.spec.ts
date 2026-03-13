import assert from 'node:assert/strict';

import test from 'node:test';

import { createPrismaClientOptions } from './prisma.config';

test('Prisma 설정은 개발 환경에서 쿼리 로그까지 활성화한다', () => {
  const options = createPrismaClientOptions({
    nodeEnv: 'development',
  });

  assert.deepEqual(options, {
    log: ['query', 'info', 'warn', 'error'],
  });
});

test('Prisma 설정은 운영 환경에서 경고와 에러만 남긴다', () => {
  const options = createPrismaClientOptions({
    nodeEnv: 'production',
  });

  assert.deepEqual(options, {
    log: ['warn', 'error'],
  });
});

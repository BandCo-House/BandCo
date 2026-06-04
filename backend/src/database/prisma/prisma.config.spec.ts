import { createPrismaClientOptions } from './prisma.config';

test('Prisma 설정은 개발 환경에서 쿼리 로그까지 활성화한다', () => {
  const options = createPrismaClientOptions({
    nodeEnv: 'development',
  });

  expect(options).toStrictEqual({
    log: ['query', 'info', 'warn', 'error'],
  });
});

test('Prisma 설정은 운영 환경에서 경고와 에러만 남긴다', () => {
  const options = createPrismaClientOptions({
    nodeEnv: 'production',
  });

  expect(options).toStrictEqual({
    log: ['warn', 'error'],
  });
});

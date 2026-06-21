import { createPrismaClientOptions } from './prisma.config';

describe('createPrismaClientOptions', () => {
  it('개발 환경에서 쿼리 로그까지 활성화한다', () => {
    const options = createPrismaClientOptions({ nodeEnv: 'development' });

    expect(options).toEqual({ log: ['query', 'info', 'warn', 'error'] });
  });

  it('운영 환경에서 경고와 에러만 남긴다', () => {
    const options = createPrismaClientOptions({ nodeEnv: 'production' });

    expect(options).toEqual({ log: ['warn', 'error'] });
  });
});

import type { Prisma } from '../../generated/prisma';

export interface PrismaClientEnvironment {
  nodeEnv: string | undefined;
}

/**
 * 개발 환경에서는 쿼리 흐름을 더 잘 볼 수 있게 하고, 운영 환경에서는 필요한 로그만 남긴다.
 *
 * @param {PrismaClientEnvironment} environment - 현재 런타임 환경 정보
 * @returns {Prisma.PrismaClientOptions} Prisma 클라이언트 생성 옵션
 */
export function createPrismaClientOptions(environment: PrismaClientEnvironment): Prisma.PrismaClientOptions {
  const isDevelopmentEnvironment = environment.nodeEnv === 'development';

  if (isDevelopmentEnvironment) {
    return {
      log: ['query', 'info', 'warn', 'error'],
    };
  }

  return {
    log: ['warn', 'error'],
  };
}

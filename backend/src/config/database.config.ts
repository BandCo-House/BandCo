export interface DatabaseConfig {
  databaseUrl: string;
}

/**
 * Prisma가 어떤 DB에 연결해야 하는지 한 곳에서 강제하기 위한 설정 진입점이다.
 *
 * @param {NodeJS.ProcessEnv} environment - 현재 프로세스 환경 변수
 * @returns {DatabaseConfig} DB 연결에 필요한 설정
 */
export function getDatabaseConfig(environment: NodeJS.ProcessEnv = process.env): DatabaseConfig {
  const databaseUrl = environment.DATABASE_URL;

  if (databaseUrl === undefined || databaseUrl.trim() === '') {
    throw new Error('DATABASE_URL 환경 변수가 필요합니다.');
  }

  return {
    databaseUrl,
  };
}

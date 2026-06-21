import { getDatabaseConfig } from './database.config';

describe('getDatabaseConfig', () => {
  it('DATABASE_URL이 있으면 해당 값을 반환한다', () => {
    const config = getDatabaseConfig({
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/jamplay?schema=public',
    });

    expect(config.databaseUrl).toBe('postgresql://postgres:postgres@localhost:5432/jamplay?schema=public');
  });

  it('DATABASE_URL이 없으면 즉시 에러를 던진다', () => {
    expect(() => {
      getDatabaseConfig({});
    }).toThrow(/DATABASE_URL 환경 변수가 필요합니다\./);
  });
});

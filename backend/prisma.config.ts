import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

import { defineConfig } from 'prisma/config';

if (existsSync('.env.development')) {
  loadEnvFile('.env.development');
} else if (existsSync('.env')) {
  loadEnvFile('.env');
}

/**
 * Prisma CLI 설정을 파일로 분리해
 * 구식 package.json 설정 경고를 없애고
 * 시드 명령 위치를 명확하게 고정한다.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
});

import { readFileSync } from 'fs';
import path from 'path';

/**
 * 최소 버전 검사(서비스 상태 게이트)에 쓰는 현재 앱 버전. package.json version이 기준이다.
 * vite.config.ts와 vitest.config.ts가 같은 값을 `__APP_VERSION__`으로 주입하도록 여기서 한 번만 읽는다.
 */
export const appVersion = (
  JSON.parse(
    readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'),
  ) as { version: string }
).version;

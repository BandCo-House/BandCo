import { readFileSync } from 'fs';
import { defineConfig } from 'vitest/config';
import path from 'path';
import svgr from 'vite-plugin-svgr';

// vite.config.ts와 같은 값을 주입한다. 테스트는 vite.config를 읽지 않는다.
const { version: appVersion } = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'),
) as { version: string };

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [svgr()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**', // Playwright E2E 테스트 제외
      'tests/e2e/**', // tests/e2e 폴더 제외
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

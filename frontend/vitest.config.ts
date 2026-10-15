import { defineConfig } from 'vitest/config';
import path from 'path';
import svgr from 'vite-plugin-svgr';
// 테스트는 vite.config를 읽지 않으므로 같은 버전 값을 여기서도 주입한다.
import { appVersion } from './app-version';

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

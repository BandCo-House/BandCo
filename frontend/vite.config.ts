import { readFileSync } from 'fs';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

// 최소 버전 검사(서비스 상태 게이트)에 쓰는 현재 앱 버전. package.json version이 기준이다.
const { version: appVersion } = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'),
) as { version: string };

const appVersionFileContent = JSON.stringify({ version: appVersion });

/**
 * 배포된 최신 앱 버전을 /version.json으로 낸다. 서비스 상태 게이트가 업데이트 화면을 띄우기 전에
 * 새로고침하면 실제로 더 높은 버전을 받을 수 있는지 확인하는 데 쓴다.
 */
const appVersionFilePlugin = (): Plugin => ({
  name: 'app-version-file',
  configureServer(server) {
    server.middlewares.use('/version.json', (_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.end(appVersionFileContent);
    });
  },
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: appVersionFileContent,
    });
  },
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.API_PROXY_TARGET ?? 'http://localhost:3000';

  return {
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },

    plugins: [
      TanStackRouterVite({
        target: 'react',
        routesDirectory: './src/pages',
        generatedRouteTree: './src/routeTree.gen.ts',
        autoCodeSplitting: false,
      }),

      react({
        babel: {
          plugins: [['babel-plugin-react-compiler']],
        },
      }),

      tailwindcss(),
      svgr(),
      appVersionFilePlugin(),
    ],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    server: {
      // 스토리지 버킷 CORS가 http://localhost:5173만 허용한다. Vite는 이 포트가
      // 점유돼 있으면 조용히 다음 포트로 넘어가는데, 그러면 허용 목록에 없는
      // origin이 되어 파일 업로드만 preflight 403으로 막힌다. 서버 로그에도
      // 아무것도 안 남아 원인을 찾기 어렵다. 포트가 막혔으면 그냥 실패하게 둔다.
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  };
});

import { readFileSync } from 'fs';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

// 최소 버전 검사(서비스 상태 게이트)에 쓰는 현재 앱 버전. package.json version이 기준이다.
const { version: appVersion } = JSON.parse(
  readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'),
) as { version: string };

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
        // 배포에서는 vercel.json이 /admin을 어드민 앱으로 넘긴다. 로컬에서도 같은 주소로
        // 열리도록 어드민 개발 서버(admin/, 5174)로 프록시한다. HMR 웹소켓도 함께 넘긴다.
        '/admin': {
          target: env.ADMIN_DEV_TARGET ?? 'http://localhost:5174',
          changeOrigin: true,
          ws: true,
          // 어드민 개발 서버는 기준 경로가 /admin/이라 끝 슬래시가 없으면 404를 낸다.
          rewrite: (path) => path.replace(/^\/admin(?=$|\?)/, '/admin/'),
        },
      },
    },
  };
});

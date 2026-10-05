import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxyTarget = env.API_PROXY_TARGET ?? 'http://localhost:3000';

  return {
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
      },
    },
  };
});

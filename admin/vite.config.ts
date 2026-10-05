import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  // 서비스 도메인의 /admin 경로로 열리도록(서비스 앱 vercel.json이 이 앱으로 넘긴다) 기준 경로를 둔다.
  // 빌드 결과도 dist/admin에 두어야 정적 파일 경로(/admin/assets/...)가 그대로 맞는다.
  base: '/admin/',
  build: {
    outDir: 'dist/admin',
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 서비스 프론트(5173)와 동시에 띄울 수 있도록 포트를 분리한다.
    port: 5174,
    strictPort: true,
    // 서비스 앱(5173)의 /admin 프록시로 열어도 HMR 웹소켓은 이 서버에 직접 붙게 한다.
    // 프록시를 거치면 연결이 끊긴 것으로 보고 페이지를 계속 새로고침한다.
    hmr: { clientPort: 5174 },
  },
});

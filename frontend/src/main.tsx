import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './app/App';

// MSW는 전부 켜거나 전부 꺼야 한다.
// 인증만 mock이고 일부 요청만 실제 서버로 보내면, mock이 발급한 토큰을 서버가 검증하지 못해 401이 난다.
// 실제 백엔드로 붙이려면 .env.local에 VITE_ENABLE_MSW=false를 둔다.
const isMockingEnabled =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_MSW !== 'false';

async function enableMocking() {
  if (!isMockingEnabled) return;

  const { worker } = await import('@/mocks/browser');
  return worker.start({ onUnhandledRequest: 'bypass' });
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});

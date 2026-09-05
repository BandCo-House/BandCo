import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { server } from '../mocks/server';
import { resetScheduleStore } from '../mocks/schedule/handlers';

/**
 * jsdom에 없는 브라우저 API를 채운다. embla-carousel처럼 마운트 시 이 API를 부르는 컴포넌트가
 * 라우터 테스트에서 throw하지 않게 한다. node 환경 테스트(scripts/)에서는 window가 없어 건너뛴다.
 */
const stubBrowserApis = () => {
  if (typeof window === 'undefined') return;

  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;

  class ObserverStub {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  }

  window.IntersectionObserver =
    ObserverStub as unknown as typeof IntersectionObserver;
  window.ResizeObserver = ObserverStub as unknown as typeof ResizeObserver;
};

stubBrowserApis();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetScheduleStore();
});
afterAll(() => server.close());

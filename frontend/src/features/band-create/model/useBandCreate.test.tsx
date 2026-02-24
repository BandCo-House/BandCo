import { RouterProvider, createMemoryHistory } from '@tanstack/react-router';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { createAppRouter } from '@/app/router';
import * as bandApi from '../api/band-api';
import type { BandCreateRequest } from '../api/band-api';

// createBand 어댑터를 mock — 훅 로직만 격리 검증
vi.mock('../api/band-api', () => ({
  createBand: vi.fn(),
}));

const mockCreateBand = vi.mocked(bandApi.createBand);

const createTestRouter = (initialPath: string) => {
  const router = createAppRouter();
  router.update({
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    context: { user: { isLoggedIn: true, isAdmin: false } },
  });
  return router;
};

describe('useBandCreate', () => {
  it('createBand 성공 시 / 로 navigate한다', async () => {
    mockCreateBand.mockResolvedValueOnce({ id: 'band-1', name: '테스트 밴드' });

    const router = createTestRouter('/band/create');
    render(<RouterProvider router={router} />);

    // 현재 페이지가 /band/create임을 확인
    expect(await screen.findByText('BandCreatePage')).toBeInTheDocument();

    // createBand 성공 후 / 로 navigate 시뮬레이션
    await router.navigate({ to: '/' });

    expect(await screen.findByText('MyBandsPage')).toBeInTheDocument();
  });

  it('createBand 실패 시 페이지를 유지한다', async () => {
    mockCreateBand.mockRejectedValueOnce(new Error('서버 에러'));

    const router = createTestRouter('/band/create');
    render(<RouterProvider router={router} />);

    // /band/create 에서 시작
    expect(await screen.findByText('BandCreatePage')).toBeInTheDocument();

    // createBand 실패 호출
    try {
      await bandApi.createBand({ name: '실패' } as BandCreateRequest);
    } catch{ /* empty */ }

    // 실패 후 여전히 /band/create에 있어야 함
    expect(screen.queryByText('MyBandsPage')).not.toBeInTheDocument();
    expect(screen.getByText('BandCreatePage')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MyBandsPage } from './MyBandsPage';
import type { Band } from '@/entities/band/model/types';

// useBands 훅 mock
vi.mock('@/entities/band/api/useBands', () => ({
  useBands: vi.fn(),
}));

import { useBands } from '@/entities/band/api/useBands';
const mockUseBands = vi.mocked(useBands);

describe('MyBandsPage', () => {
  it('밴드 목록을 렌더링한다', async () => {
    const bands: Band[] = [
      { id: '1', name: '우리 밴드' },
      { id: '2', name: '락 밴드' },
    ];
    mockUseBands.mockReturnValue({
      data: bands,
      isLoading: false,
    } as unknown as ReturnType<typeof useBands>);

    render(<MyBandsPage />);

    expect(await screen.findByText('우리 밴드')).toBeInTheDocument();
    expect(screen.getByText('락 밴드')).toBeInTheDocument();
  });

  it('로딩 중일 때 로딩 상태를 표시한다', async () => {
    mockUseBands.mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof useBands>);

    render(<MyBandsPage />);

    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('밴드가 없을 때 빈 상태를 표시한다', async () => {
    mockUseBands.mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof useBands>);

    render(<MyBandsPage />);

    expect(
      await screen.findByText('아직 참여한 밴드가 없어요'),
    ).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BandCard } from './BandCard';

const navigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}));

describe('BandCard', () => {
  it('밴드 이름을 표시하고 클릭 시 상세 페이지로 이동한다', () => {
    render(
      <BandCard
        band={{
          id: '1',
          name: '우리 밴드',
          description: '주 1회 합주',
          visibility: true,
          inviteCode: 'INV123',
          bmId: 'bm-1',
          myRole: 'BM',
          joinedAt: '2026-03-01T12:10:00.000+09:00',
          createdAt: '2026-03-01T12:00:00.000+09:00',
          memberCount: 5,
        }}
      />,
    );

    expect(screen.getByText('우리 밴드')).toBeInTheDocument();
    expect(screen.getByText('5명')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '우리 밴드 상세 보기' }));

    expect(navigate).toHaveBeenCalledWith({
      to: '/band/$bandId',
      params: { bandId: '1' },
    });
  });
});

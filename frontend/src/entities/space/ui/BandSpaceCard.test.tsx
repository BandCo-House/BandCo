import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { BandSpaceCard } from './BandSpaceCard';
import type { Space } from '../model/types';

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    params,
  }: {
    children: ReactNode;
    params?: { bandId: string; spaceId: string };
  }) => (
    <a href="#" data-band={params?.bandId} data-space={params?.spaceId}>
      {children}
    </a>
  ),
}));

const space: Space = {
  spaceId: 'space-2',
  bandId: 'band-1',
  name: '봄꽃 축제',
  description: '봄꽃 축제 연주곡 연습',
  spaceType: 'PRACTICE',
  status: 'ACTIVE',
  startDate: '2026-01-01',
  endDate: '2026-12-31',
};

describe('BandSpaceCard', () => {
  it('이름·설명·배지를 표시하고 스페이스 링크를 건다', () => {
    render(<BandSpaceCard bandId="band-1" space={space} />);

    expect(screen.getByText('봄꽃 축제')).toBeInTheDocument();
    expect(screen.getByText('봄꽃 축제 연주곡 연습')).toBeInTheDocument();
    // PRACTICE 공간은 상시 배지
    expect(screen.getByText('상시')).toBeInTheDocument();

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('data-space', 'space-2');
    expect(link).toHaveAttribute('data-band', 'band-1');
  });
});

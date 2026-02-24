import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BandCard } from './BandCard';

describe('BandCard', () => {
  it('밴드 이름을 표시한다', () => {
    render(<BandCard band={{ id: '1', name: '우리 밴드', memberCount: 1 }} />);
    expect(screen.getByText('우리 밴드')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SpaceSummaryHeader } from './SpaceSummaryHeader';

describe('SpaceSummaryHeader', () => {
  it('이름·설명과 멤버 수·곡 수 칩을 표시한다', () => {
    render(
      <SpaceSummaryHeader
        name="2026 하계 공연 무대"
        description="여름 축제 공연 준비"
        memberCount={14}
        songCount={6}
      />,
    );

    expect(
      screen.getByRole('heading', { name: '2026 하계 공연 무대' }),
    ).toBeInTheDocument();
    expect(screen.getByText('여름 축제 공연 준비')).toBeInTheDocument();
    expect(screen.getByText('14명')).toBeInTheDocument();
    expect(screen.getByText('6곡')).toBeInTheDocument();
  });

  it('카운트가 없으면 칩을 렌더하지 않는다', () => {
    render(<SpaceSummaryHeader name="합주 공간" />);

    expect(screen.queryByText(/명$/)).not.toBeInTheDocument();
    expect(screen.queryByText(/곡$/)).not.toBeInTheDocument();
  });
});

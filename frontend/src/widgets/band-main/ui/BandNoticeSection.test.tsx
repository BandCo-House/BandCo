import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { BandNoticeSection } from './BandNoticeSection';

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: ReactNode }) => <a href="#">{children}</a>,
}));

const useBandNoticesMock = vi.fn();
vi.mock('@/entities/notice/api/useBandNotices', () => ({
  useBandNotices: (...args: unknown[]) => useBandNoticesMock(...args),
}));

describe('BandNoticeSection', () => {
  it('공지가 없으면 안내 문구를 표시한다', () => {
    useBandNoticesMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });

    render(<BandNoticeSection bandId="band-1" />);

    expect(screen.getByText('공지사항이 없습니다.')).toBeInTheDocument();
  });

  it('오류도 빈 목록과 같이 취급한다(엔드포인트 미구현이라 항상 실패)', () => {
    useBandNoticesMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });

    render(<BandNoticeSection bandId="band-1" />);

    expect(screen.getByText('공지사항이 없습니다.')).toBeInTheDocument();
  });

  it('공지를 링크 항목으로 표시한다', () => {
    useBandNoticesMock.mockReturnValue({
      data: [
        {
          id: '1',
          content: '정기 모임 공지',
          createdAt: '2026-02-13T10:00:00+09:00',
        },
      ],
      isLoading: false,
      isError: false,
    });

    render(<BandNoticeSection bandId="band-1" />);

    expect(screen.getByText('정기 모임 공지')).toBeInTheDocument();
    // 더보기 링크 + 공지 항목 링크
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
});

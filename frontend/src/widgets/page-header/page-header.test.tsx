import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('기본 헤더는 페이지 이름만 렌더링한다', () => {
    render(<PageHeader title="2026 하계공연 무대" />);

    expect(
      screen.getByRole('heading', { name: '2026 하계공연 무대' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '뒤로 가기' })).toBeNull();
  });

  it('showBack=true이면 직접 렌더링한 뒤로가기 버튼을 표시하고 이벤트를 실행한다', () => {
    const onBack = vi.fn();

    render(<PageHeader title="공연 상세" showBack onBack={onBack} />);

    const backButton = screen.getByRole('button', { name: '뒤로 가기' });

    expect(backButton.querySelector('[data-slot="svg-icon"]')).toHaveClass(
      'rotate-180',
    );
    fireEvent.click(backButton);
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('우측 컨텐츠가 있으면 렌더링한다', () => {
    render(<PageHeader title="홈" rightContent={<div>HEADER_UTILS</div>} />);

    expect(screen.getByText('HEADER_UTILS')).toBeInTheDocument();
  });

  it('모든 페이지에서 공통 헤더 셸은 전역 본문 셸과 동일한 최대 너비 클래스를 사용해야 한다', () => {
    render(<PageHeader title="BandCo" />);

    expect(screen.getByRole('banner').firstElementChild).toHaveClass(
      'mx-auto',
      'w-full',
      'max-w-7xl',
      'px-6',
    );
  });

  it('타이틀은 기본 상태에서도 모바일에서 보여야 한다', () => {
    render(<PageHeader title="BandCo" />);

    expect(screen.getByRole('heading', { name: 'BandCo' })).not.toHaveClass(
      'sr-only',
    );
  });
});

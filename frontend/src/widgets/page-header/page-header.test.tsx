import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PageHeader } from './page-header';

describe('PageHeader', () => {
  it('헤더 기본 정보와 메타 정보를 렌더링한다', () => {
    render(
      <PageHeader
        title="2026 하계공연 무대"
        subtitle="여름 축제 공연 준비"
        brandLabel="밴드"
        meta={['멤버 8명', '공연 12회']}
      />,
    );

    expect(screen.getByText('밴드')).toBeInTheDocument();
    expect(screen.getByText('2026 하계공연 무대')).toBeInTheDocument();
    expect(screen.getByText('여름 축제 공연 준비')).toBeInTheDocument();
    expect(screen.getByText('멤버 8명')).toBeInTheDocument();
    expect(screen.getByText('공연 12회')).toBeInTheDocument();
  });

  it('탭, 우측 컨텐츠, 우측 액션 버튼을 렌더링하고 이벤트를 실행한다', () => {
    const onTabClick = vi.fn();
    const onRightActionClick = vi.fn();

    render(
      <PageHeader
        title="공연 상세"
        tabs={[
          { key: 'calendar', label: '캘린더', active: true, onClick: onTabClick },
          { key: 'songs', label: '곡 라이브러리' },
        ]}
        rightContent={<div>HEADER_UTILS</div>}
        rightActionLabel="설정"
        onRightActionClick={onRightActionClick}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '캘린더' }));
    fireEvent.click(screen.getByRole('button', { name: '설정' }));

    expect(screen.getByText('HEADER_UTILS')).toBeInTheDocument();
    expect(onTabClick).toHaveBeenCalledTimes(1);
    expect(onRightActionClick).toHaveBeenCalledTimes(1);
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

  it('타이틀은 모바일에서 숨김 클래스를 가져야 한다', () => {
    render(<PageHeader title="BandCo" />);

    expect(screen.getByRole('heading', { name: 'BandCo' })).toHaveClass(
      'hidden',
      'sm:block',
    );
  });
});

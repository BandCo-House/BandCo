import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BottomNavBar } from './BottomNavBar';
import type { NavItem } from '../nav-items';

vi.mock('@tanstack/react-router', () => ({
  useRouterState: vi.fn(),
  Link: ({
    to,
    children,
    ...props
  }: {
    to: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

import { useRouterState } from '@tanstack/react-router';

const mockUseRouterState = vi.mocked(useRouterState);

/** 테스트 전용 mock 메뉴 아이템 — 실제 NAV_ITEMS와 무관하게 동작을 검증한다 */
const MOCK_ITEMS: NavItem[] = [
  {
    key: 'alpha',
    label: 'Alpha',
    to: '/alpha',
    icon: () => <svg aria-hidden />,
  },
  { key: 'beta', label: 'Beta', to: '/beta', icon: () => <svg aria-hidden /> },
  {
    key: 'gamma',
    label: 'Gamma',
    to: '/gamma',
    icon: () => <svg aria-hidden />,
  },
];

function renderNav(pathname: string, items = MOCK_ITEMS) {
  mockUseRouterState.mockReturnValue(
    pathname as unknown as ReturnType<typeof useRouterState>,
  );
  return render(<BottomNavBar items={items} />);
}

describe('BottomNavBar', () => {
  it('전달된 items를 모두 렌더링한다', () => {
    renderNav('/alpha');

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getByText('Gamma')).toBeInTheDocument();
  });

  it('nav landmark와 aria-label이 올바르게 설정된다', () => {
    renderNav('/alpha');

    expect(
      screen.getByRole('navigation', { name: '하단 네비게이션' }),
    ).toBeInTheDocument();
  });

  it('현재 pathname과 일치하는 메뉴에 aria-current="page"가 설정된다', () => {
    renderNav('/beta');

    expect(screen.getByText('Beta').closest('a')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('현재 pathname과 일치하지 않는 메뉴에는 aria-current가 없다', () => {
    renderNav('/beta');

    expect(screen.getByText('Alpha').closest('a')).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByText('Gamma').closest('a')).not.toHaveAttribute(
      'aria-current',
    );
  });

  it('각 메뉴 링크의 href가 item.to와 일치한다', () => {
    renderNav('/alpha');

    expect(screen.getByText('Alpha').closest('a')).toHaveAttribute(
      'href',
      '/alpha',
    );
    expect(screen.getByText('Beta').closest('a')).toHaveAttribute(
      'href',
      '/beta',
    );
    expect(screen.getByText('Gamma').closest('a')).toHaveAttribute(
      'href',
      '/gamma',
    );
  });

  it('pathname이 변경되면 active 메뉴도 변경된다', () => {
    const { rerender } = renderNav('/alpha');
    expect(screen.getByText('Alpha').closest('a')).toHaveAttribute(
      'aria-current',
      'page',
    );

    mockUseRouterState.mockReturnValue(
      '/gamma' as unknown as ReturnType<typeof useRouterState>,
    );
    rerender(<BottomNavBar items={MOCK_ITEMS} />);

    expect(screen.getByText('Alpha').closest('a')).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByText('Gamma').closest('a')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('items를 전달하지 않으면 기본 NAV_ITEMS로 렌더링된다', () => {
    mockUseRouterState.mockReturnValue(
      '/' as unknown as ReturnType<typeof useRouterState>,
    );
    render(<BottomNavBar />);

    // 실제 메뉴 항목 수(4개)만 검증 — 레이블 하드코딩 없이
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(4);
  });
});

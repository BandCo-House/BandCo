import type { ReactNode } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouteHeader } from './route-header';
import type { HeaderStaticConfig } from './types';

// RouteHeader는 useRouter/Link만 라우터에서 쓴다. 라우터 컨텍스트 없이 검증하려고 얇게 목킹.
const { back, navigate } = vi.hoisted(() => ({
  back: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
  useRouter: () => ({
    history: { back },
    navigate,
    state: { location: { pathname: '/' } },
  }),
  Link: ({ children, to }: { children: ReactNode; to?: string }) => (
    <a href={typeof to === 'string' ? to : '#'}>{children}</a>
  ),
}));

const makeHeader = (
  overrides: Partial<HeaderStaticConfig> = {},
): HeaderStaticConfig => ({
  showBack: false,
  backBehavior: 'route',
  bottomBlur: true,
  ...overrides,
});

const params: Record<string, string> = {};

describe('RouteHeader', () => {
  beforeEach(() => {
    back.mockClear();
    navigate.mockClear();
  });

  it('기본 헤더는 페이지 이름만 렌더링한다', () => {
    render(
      <RouteHeader
        header={makeHeader({ title: '2026 하계공연 무대' })}
        params={params}
      />,
    );

    expect(
      screen.getByRole('heading', { name: '2026 하계공연 무대' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '뒤로 가기' })).toBeNull();
  });

  it('showBack=true이면 뒤로가기 버튼을 표시하고 클릭 시 router.history.back을 호출한다', () => {
    render(
      <RouteHeader
        header={makeHeader({ title: '공연 상세', showBack: true })}
        params={params}
      />,
    );

    const backButton = screen.getByRole('button', { name: '뒤로 가기' });
    expect(backButton.querySelector('[data-slot="svg-icon"]')).toHaveClass(
      'rotate-180',
    );

    fireEvent.click(backButton);
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('renderRight 함수가 제공되면 우측 컨텐츠로 렌더링한다', () => {
    render(
      <RouteHeader
        header={makeHeader({
          title: '홈',
          renderRight: () => <div>HEADER_UTILS</div>,
        })}
        params={params}
      />,
    );

    expect(screen.getByText('HEADER_UTILS')).toBeInTheDocument();
  });

  it('rightAction(label+to)이 있으면 우측 액션 링크를 렌더링한다', () => {
    render(
      <RouteHeader
        header={makeHeader({
          title: '팀',
          rightActionLabel: '초대',
          rightActionTo: '/invite',
        })}
        params={params}
      />,
    );

    expect(screen.getByText('초대')).toBeInTheDocument();
  });

  it('공통 헤더 셸은 전역 본문 셸과 동일한 최대 너비 클래스를 사용한다', () => {
    render(
      <RouteHeader header={makeHeader({ title: 'BandCo' })} params={params} />,
    );

    expect(screen.getByRole('banner').firstElementChild).toHaveClass(
      'mx-auto',
      'w-full',
      'max-w-7xl',
      'px-5',
    );
  });

  it('타이틀은 기본 상태에서도 모바일에서 보인다', () => {
    render(
      <RouteHeader header={makeHeader({ title: 'BandCo' })} params={params} />,
    );

    expect(screen.getByRole('heading', { name: 'BandCo' })).not.toHaveClass(
      'sr-only',
    );
  });

  it('heightVariant 크기에 맞춰 높이 클래스를 적용한다', () => {
    const { rerender } = render(
      <RouteHeader
        header={makeHeader({ title: '테스트', heightVariant: 'xs' })}
        params={params}
      />,
    );
    expect(screen.getByRole('banner').firstElementChild).toHaveClass('min-h-9');

    rerender(
      <RouteHeader
        header={makeHeader({ title: '테스트', heightVariant: 'sm' })}
        params={params}
      />,
    );
    expect(screen.getByRole('banner').firstElementChild).toHaveClass(
      'min-h-14',
    );

    rerender(
      <RouteHeader
        header={makeHeader({ title: '테스트', heightVariant: 'md' })}
        params={params}
      />,
    );
    expect(screen.getByRole('banner').firstElementChild).toHaveClass(
      'min-h-[60px]',
    );

    rerender(
      <RouteHeader
        header={makeHeader({ title: '테스트', heightVariant: 'lg' })}
        params={params}
      />,
    );
    expect(screen.getByRole('banner').firstElementChild).toHaveClass(
      'min-h-16',
    );
  });

  it('titleSize가 md이면 typo-lg-sb 클래스를 사용한다', () => {
    render(
      <RouteHeader
        header={makeHeader({ title: '중간 크기 타이틀', titleSize: 'md' })}
        params={params}
      />,
    );
    expect(
      screen.getByRole('heading', { name: '중간 크기 타이틀' }),
    ).toHaveClass('typo-lg-sb');
  });

  it('title로 함수가 전달되면 기본 h1 래퍼 없이 컴포넌트 자체를 렌더링한다', () => {
    render(
      <RouteHeader
        header={makeHeader({
          title: () => <span data-testid="custom-title">로고</span>,
        })}
        params={params}
      />,
    );
    expect(screen.getByTestId('custom-title')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).toBeNull();
  });
});

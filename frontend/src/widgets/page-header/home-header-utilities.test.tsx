import type { ComponentProps } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { HomeHeaderUtilities } from './home-header-utilities';

vi.mock('@/entities/notification/api/useNotificationUnreadSummary', () => ({
  useNotificationUnreadSummary: () => ({
    data: {
      unreadCount: 3,
      unreadByType: {
        NOTICE: 1,
        INVITE: 1,
        REMINDER: 1,
      },
    },
  }),
}));

vi.mock('@/entities/notification/api/useMarkNotificationAsRead', () => ({
  useMarkNotificationAsRead: () => ({
    mutate: vi.fn(),
  }),
}));

vi.mock('@/entities/notification/api/useMarkAllNotificationsAsRead', () => ({
  useMarkAllNotificationsAsRead: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({
      children,
      to,
      ...props
    }: ComponentProps<'a'> & { to?: string }) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

describe('HomeHeaderUtilities', () => {
  it('기본 렌더에서는 검색바 없이 프로필만 렌더링한다', () => {
    render(<HomeHeaderUtilities />);

    expect(screen.getByLabelText('프로필 열기')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('밴드/사용자를 찾아보세요')).not.toBeInTheDocument();
  });

  it('showSearchBar=true이면 검색바가 렌더링된다', () => {
    render(<HomeHeaderUtilities showSearchBar />);

    const input = screen.getByPlaceholderText('밴드/사용자를 찾아보세요');
    fireEvent.change(input, { target: { value: '테스트 검색어' } });

    expect(input).toHaveValue('테스트 검색어');
    expect(screen.getByLabelText('프로필 열기')).toBeInTheDocument();
  });

  it('showProfileAvatar=false이면 프로필 아바타를 렌더링하지 않는다', () => {
    render(<HomeHeaderUtilities showProfileAvatar={false} />);

    expect(screen.queryByLabelText('프로필 열기')).not.toBeInTheDocument();
    expect(document.querySelector('.w-px')).not.toBeInTheDocument();
  });

  it('showNotificationTrigger=true이면 알림 버튼과 배지가 렌더링된다', () => {
    render(<HomeHeaderUtilities showNotificationTrigger />);

    expect(screen.getByRole('button', { name: '알림 열기' })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '알림 열기' }));

    expect(screen.getByRole('heading', { name: '알림' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '모두 읽음' })).toBeInTheDocument();
    expect(screen.getByText('인디 밴드 초대장 도착!')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /인디 밴드 초대장 도착!/ })).toHaveAttribute(
      'href',
      '/invite/a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1',
    );

    fireEvent.click(screen.getByRole('button', { name: '일정' }));

    expect(screen.getByText('합주 일정 임박')).toBeInTheDocument();
    expect(screen.queryByText('인디 밴드 초대장 도착!')).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NotificationCard } from './NotificationCard';
import type { NotificationItem } from '@/entities/notification/model/types';

describe('NotificationCard', () => {
  const mockNoti: NotificationItem = {
    notificationId: 'noti-123',
    type: 'NOTICE',
    title: '새로운 공지사항',
    description: '공지사항 설명글입니다.',
    isRead: false,
    targetPath: '/notice/123',
    createdAt: '2026-06-12T00:00:00Z',
  };

  const defaultProps = {
    noti: mockNoti,
    isEditMode: false,
    isSelected: false,
    onToggleSelect: vi.fn(),
    onAction: vi.fn(),
    onDelete: vi.fn(),
    onMarkAsRead: vi.fn(),
  };

  it('알림의 제목과 설명을 정상적으로 렌더링한다', () => {
    render(<NotificationCard {...defaultProps} />);

    expect(screen.getByText('새로운 공지사항')).toBeInTheDocument();
    expect(screen.getByText('공지사항 설명글입니다.')).toBeInTheDocument();
  });

  it('읽지 않은 알림은 unread 스타일 클래스를 갖는다', () => {
    const { container } = render(<NotificationCard {...defaultProps} />);
    const cardDiv = container.firstChild as HTMLElement;

    expect(cardDiv).toHaveClass('bg-[rgba(220,226,249,0.4)]');
    expect(screen.getByText('새로운 공지사항')).toHaveClass('text-white');
  });

  it('읽은 알림은 read 스타일 클래스를 갖는다', () => {
    const readNoti = { ...mockNoti, isRead: true };
    const { container } = render(<NotificationCard {...defaultProps} noti={readNoti} />);
    const cardDiv = container.firstChild as HTMLElement;

    expect(cardDiv).toHaveClass('bg-[rgba(101,99,122,0.48)]');
    expect(screen.getByText('새로운 공지사항')).toHaveClass('text-[#C6C6C8]');
  });

  it('알림 카드 클릭 시 onAction 콜백이 호출된다', () => {
    render(<NotificationCard {...defaultProps} />);

    fireEvent.click(screen.getByText('새로운 공지사항'));
    expect(defaultProps.onAction).toHaveBeenCalledWith(
      'noti-123',
      'NOTICE',
      '/notice/123',
      false
    );
  });

  it('일반 알림의 삼점 메뉴 클릭 시 삭제하기, 읽음 처리, 이전 버튼이 렌더링되고 작동한다', async () => {
    render(<NotificationCard {...defaultProps} />);

    const menuBtn = screen.getByRole('button', { name: '알림 메뉴 열기' });
    fireEvent.click(menuBtn);

    const deleteBtn = await screen.findByRole('button', { name: '삭제하기' });
    const markReadBtn = screen.getByRole('button', { name: '읽음 처리' });
    const cancelBtn = screen.getByRole('button', { name: '이전' });

    expect(deleteBtn).toBeInTheDocument();
    expect(markReadBtn).toBeInTheDocument();
    expect(cancelBtn).toBeInTheDocument();

    // 읽음 처리 클릭 검증
    fireEvent.click(markReadBtn);
    expect(defaultProps.onMarkAsRead).toHaveBeenCalledWith('noti-123');

    // 다시 열기
    fireEvent.click(menuBtn);
    const deleteBtnAgain = await screen.findByRole('button', { name: '삭제하기' });
    
    // 삭제하기 클릭 검증
    fireEvent.click(deleteBtnAgain);
    expect(defaultProps.onDelete).toHaveBeenCalledWith('noti-123');
  });

  it('이미 읽은 알림의 삼점 메뉴 클릭 시 읽음 처리 버튼이 비활성화된다', async () => {
    const readNoti = { ...mockNoti, isRead: true };
    render(<NotificationCard {...defaultProps} noti={readNoti} />);

    const menuBtn = screen.getByRole('button', { name: '알림 메뉴 열기' });
    fireEvent.click(menuBtn);

    const markReadBtn = await screen.findByRole('button', { name: '읽음 처리' });
    expect(markReadBtn).toBeDisabled();
    expect(markReadBtn).toHaveClass('cursor-not-allowed');
  });

  describe('초대장(INVITE) 타입 알림', () => {
    const inviteNoti: NotificationItem = {
      notificationId: 'noti-invite',
      type: 'INVITE',
      title: '밴드 초대',
      description: '초대 메시지',
      isRead: false,
      targetPath: '/invite/abc',
      createdAt: '2026-06-12T00:00:00Z',
    };

    it('읽지 않은 초대장은 "수락" 버튼을 표시한다', () => {
      render(<NotificationCard {...defaultProps} noti={inviteNoti} />);

      expect(screen.getByRole('button', { name: '수락' })).toBeInTheDocument();
      expect(screen.queryByText('수락됨')).not.toBeInTheDocument();
    });

    it('이미 읽은 초대장은 비활성화된 "수락됨" 텍스트를 표시한다', () => {
      const readInvite = { ...inviteNoti, isRead: true };
      render(<NotificationCard {...defaultProps} noti={readInvite} />);

      expect(screen.getByText('수락됨')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: '수락' })).not.toBeInTheDocument();
    });

    it('삼점 메뉴 클릭 시 거절하기가 렌더링되고 클릭 시 onDelete가 호출된다', async () => {
      render(<NotificationCard {...defaultProps} noti={inviteNoti} />);

      const menuBtn = screen.getByRole('button', { name: '알림 메뉴 열기' });
      fireEvent.click(menuBtn);

      const declineBtn = await screen.findByRole('button', { name: '거절하기' });
      expect(declineBtn).toBeInTheDocument();

      fireEvent.click(declineBtn);
      expect(defaultProps.onDelete).toHaveBeenCalledWith('noti-invite');
    });
  });
});

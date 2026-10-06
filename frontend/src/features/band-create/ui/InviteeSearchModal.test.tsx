import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import type { UserSearchItem } from '@/entities/user';
import { InviteeSearchModal } from './InviteeSearchModal';

const SELF: UserSearchItem = {
  id: 'user-001',
  nickname: '김민수',
  avatarUrl: null,
  status: 'ACTIVE',
};
const ACTIVE_OTHER: UserSearchItem = {
  id: 'user-2',
  nickname: '김지은',
  avatarUrl: null,
  status: 'ACTIVE',
};
const INACTIVE_OTHER: UserSearchItem = {
  id: 'user-5',
  nickname: '김도윤',
  avatarUrl: null,
  status: 'INACTIVE',
};

const respondWith = (items: UserSearchItem[]) => {
  server.use(
    http.get('*/users', () =>
      HttpResponse.json({
        status: 'success',
        error: null,
        message: '유저 목록 조회 성공',
        data: {
          items,
          meta: { count: items.length, take: 20, cursor: null, next: null },
        },
      }),
    ),
  );
};

const renderModal = (selected: UserSearchItem[] = []) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onToggle = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <InviteeSearchModal
        open
        onOpenChange={vi.fn()}
        selected={selected}
        onToggle={onToggle}
        currentUserId={SELF.id}
      />
    </QueryClientProvider>,
  );

  return { onToggle };
};

const searchFor = (keyword: string) =>
  userEvent.type(
    screen.getByRole('textbox', { name: '이름으로 검색하세요' }),
    keyword,
  );

describe('InviteeSearchModal', () => {
  it('검색 결과에 본인과 비활성 유저가 섞여 있을 때, 목록은 초대 가능한 유저만 보여줘야 한다', async () => {
    respondWith([SELF, ACTIVE_OTHER, INACTIVE_OTHER]);
    renderModal();

    await searchFor('김');

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: ACTIVE_OTHER.nickname }),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByRole('button', { name: SELF.nickname }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: INACTIVE_OTHER.nickname }),
    ).not.toBeInTheDocument();
  });

  it('이미 초대 대상으로 고른 유저일 때, 그 행은 선택 상태로 표시되어야 한다', async () => {
    respondWith([ACTIVE_OTHER]);
    renderModal([ACTIVE_OTHER]);

    await searchFor('김');

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: ACTIVE_OTHER.nickname }),
      ).toHaveAttribute('aria-pressed', 'true');
    });
  });

  it('검색 결과의 행을 눌렀을 때, onToggle이 그 유저로 호출되어야 한다', async () => {
    respondWith([ACTIVE_OTHER]);
    const { onToggle } = renderModal();

    await searchFor('김');
    await userEvent.click(
      await waitFor(() =>
        screen.getByRole('button', { name: ACTIVE_OTHER.nickname }),
      ),
    );

    expect(onToggle).toHaveBeenCalledWith(ACTIVE_OTHER);
  });

  it('검색어를 입력하지 않았을 때, 목록 대신 검색을 유도하는 안내만 보여야 한다', () => {
    renderModal();

    expect(screen.getByText('이름으로 멤버를 찾아보세요.')).toBeInTheDocument();
  });
});

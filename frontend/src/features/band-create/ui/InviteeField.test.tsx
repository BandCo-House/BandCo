import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { UserSearchItem } from '@/entities/user';
import { InviteeField } from './InviteeField';

const INVITEE: UserSearchItem = {
  id: 'user-2',
  nickname: '김지은',
  handle: 'handle_1',
  avatarUrl: null,
  status: 'ACTIVE',
};

const renderField = (selected: UserSearchItem[] = []) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onAdd = vi.fn();
  const onRemove = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <InviteeField
        selected={selected}
        onAdd={onAdd}
        onRemove={onRemove}
        currentUserId="user-001"
      />
    </QueryClientProvider>,
  );

  return { onAdd, onRemove };
};

describe('InviteeField', () => {
  it('아무도 고르지 않았을 때, 필드는 검색을 유도하는 문구를 보여줘야 한다', () => {
    renderField();

    expect(
      screen.getByRole('button', { name: '이름으로 검색하세요' }),
    ).toBeInTheDocument();
  });

  it('필드를 눌렀을 때, 멤버 초대 검색 모달이 열려야 한다', async () => {
    renderField();

    await userEvent.click(
      screen.getByRole('button', { name: '이름으로 검색하세요' }),
    );

    expect(screen.getByRole('dialog', { name: '멤버 초대' })).toBeVisible();
  });

  it('초대 대상을 골랐을 때, 필드는 인원 수를 보여주고 칩으로 이름을 나열해야 한다', () => {
    renderField([INVITEE]);

    expect(
      screen.getByRole('button', { name: '1명을 초대해요' }),
    ).toBeInTheDocument();
    expect(screen.getByText(INVITEE.nickname)).toBeInTheDocument();
  });

  it('칩의 취소 버튼을 눌렀을 때, onRemove가 그 유저 ID로 호출되어야 한다', async () => {
    const { onRemove } = renderField([INVITEE]);

    await userEvent.click(
      screen.getByRole('button', { name: `${INVITEE.nickname} 초대 취소` }),
    );

    expect(onRemove).toHaveBeenCalledWith(INVITEE.id);
  });
});

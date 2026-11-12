import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { SpaceCreateModal } from './SpaceCreateModal';

const renderModal = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <SpaceCreateModal open onOpenChange={vi.fn()} bandId="band-1" />
    </QueryClientProvider>,
  );
};

// jsdom에는 scrollIntoView가 없다. 빈칸으로 데려가는 동작 중 스크롤은 여기서 보지 않는다.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe('SpaceCreateModal', () => {
  it('열자마자 경고를 띄우지 않고, 만들기는 눌러 볼 수 있다', () => {
    renderModal();

    expect(screen.queryByText('합주 이름을 입력해주세요.')).toBeNull();
    expect(screen.getByRole('button', { name: '만들기' })).toBeEnabled();
  });

  it('빠진 칸이 있으면 만들기를 눌렀을 때 첫 빈칸으로 데려가고 이유를 알려준다', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: '만들기' }));

    const nameInput = screen.getByLabelText(/합주 이름/);
    expect(screen.getByText('합주 이름을 입력해주세요.')).toBeInTheDocument();
    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(nameInput).toHaveFocus();
    expect(
      screen.getByText('참여자를 1명 이상 골라주세요.'),
    ).toBeInTheDocument();
  });

  it('이름을 채우면 그 경고는 사라지고 남은 빈칸(참여자)으로 데려간다', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: '만들기' }));
    await user.type(screen.getByLabelText(/합주 이름/), '정기 모임');
    await user.click(screen.getByRole('button', { name: '만들기' }));

    expect(screen.queryByText('합주 이름을 입력해주세요.')).toBeNull();
    expect(screen.getByRole('group', { name: '참여자' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(
      screen.getByRole('button', { name: '참여자를 선택하세요' }),
    ).toHaveFocus();
  });
});

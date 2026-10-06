import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SongCreateModal } from './SongCreateModal';

const renderModal = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SongCreateModal open onOpenChange={vi.fn()} bandId="band-1" />
    </QueryClientProvider>,
  );
};

/** 곡 검색 모달을 열고 검색어를 입력한다. */
const searchFor = async (
  user: ReturnType<typeof userEvent.setup>,
  keyword: string,
) => {
  await user.click(screen.getByRole('button', { name: '곡 검색' }));
  await user.type(
    screen.getByLabelText('제목, 가수로 곡을 검색하세요'),
    keyword,
  );
};

describe('SongCreateModal', () => {
  it('열면 합주곡 추가 폼이 보이고 필수값이 비어 추가는 비활성이다', () => {
    renderModal();

    expect(
      screen.getByRole('heading', { name: '합주곡 추가' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('곡 제목')).toHaveValue('');
    expect(screen.getByRole('button', { name: '추가' })).toBeDisabled();
  });

  it('제목과 아티스트를 직접 입력하면 추가가 활성된다', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText('곡 제목'), '자작곡');
    await user.type(screen.getByLabelText('아티스트'), '우리밴드');

    expect(screen.getByRole('button', { name: '추가' })).toBeEnabled();
  });

  it('곡 길이 형식이 어긋나면 안내를 보여주고 추가를 막는다', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText('곡 제목'), '자작곡');
    await user.type(screen.getByLabelText('아티스트'), '우리밴드');
    await user.type(screen.getByLabelText('곡 길이'), '437');

    expect(
      screen.getByText('곡 길이는 4:37 형식으로 입력해주세요.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '추가' })).toBeDisabled();
  });

  it('검색 결과를 고르면 제목·아티스트·곡 길이가 채워진다', async () => {
    const user = userEvent.setup();
    renderModal();

    await searchFor(user, '데이식스');
    const result = await screen.findByRole(
      'button',
      { name: /데이식스 관련 곡 1/ },
      { timeout: 3000 },
    );
    await user.click(result);

    expect(screen.getByLabelText('곡 제목')).toHaveValue('데이식스 관련 곡 1');
    expect(screen.getByLabelText('아티스트')).toHaveValue('DAY6(데이식스)');
    expect(screen.getByLabelText('곡 길이')).toHaveValue('3:22');
    expect(screen.getByRole('button', { name: '추가' })).toBeEnabled();
  });

  const enterManually = async (user: ReturnType<typeof userEvent.setup>) => {
    await searchFor(user, '없는곡');
    const manualEntry = await screen.findByRole(
      'button',
      { name: '찾는 곡이 없나요? 직접 입력하기' },
      { timeout: 3000 },
    );
    await user.click(manualEntry);
  };

  it('직접 입력하기로 넘어오면 검색어를 옮기지 않고 유튜브 링크 입력을 보여준다', async () => {
    const user = userEvent.setup();
    renderModal();

    await enterManually(user);

    // 검색어에는 가수 이름이 섞여 있을 수 있어 곡 제목으로 넘기지 않는다.
    expect(screen.getByLabelText('곡 제목')).toHaveValue('');
    expect(screen.getByLabelText('유튜브 링크로 채우기')).toBeInTheDocument();
  });

  it('유튜브 링크를 불러오면 곡 제목·아티스트 초안이 채워진다', async () => {
    const user = userEvent.setup();
    renderModal();

    await enterManually(user);
    await user.type(
      screen.getByLabelText('유튜브 링크로 채우기'),
      'https://youtu.be/LjhCEhWiKXk',
    );
    await user.click(screen.getByRole('button', { name: '불러오기' }));

    await waitFor(() =>
      expect(screen.getByLabelText('곡 제목')).toHaveValue('Count On Me'),
    );
    expect(screen.getByLabelText('아티스트')).toHaveValue('Bruno Mars');
  });
});

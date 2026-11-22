import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { SessionSection } from './SessionSection';

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  // 검색 결과 줄의 프로필 링크가 라우터 컨텍스트를 요구한다. 이동은 여기서 보지 않는다.
  Link: ({
    children,
    'aria-label': ariaLabel,
  }: {
    children: React.ReactNode;
    'aria-label'?: string;
  }) => <a aria-label={ariaLabel}>{children}</a>,
}));

const renderSection = (onChange = vi.fn()) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <SessionSection bandId="band-1" value={[]} onChange={onChange} />
    </QueryClientProvider>,
  );
  return onChange;
};

describe('SessionSection', () => {
  it('세션을 고르지 않고 멤버를 고르면 그 멤버의 대표 세션으로 배정한다', async () => {
    const user = userEvent.setup();
    const onChange = renderSection();

    // 세션을 먼저 고르라고 막지 않고 바로 멤버 검색이 열린다.
    await user.click(screen.getByRole('button', { name: '전체' }));
    await user.click(await screen.findByRole('radio', { name: /김민수/ }));

    // mock 김민수의 세션은 보컬(대표)·기타다.
    expect(onChange).toHaveBeenCalledWith([
      { skillTypeId: 'vocal-1', bandMemberId: 'member-1' },
    ]);
  });
});

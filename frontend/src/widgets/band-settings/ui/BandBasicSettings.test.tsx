import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { BandDetail } from '@/entities/band/model/types';
import { BandBasicSettings } from './BandBasicSettings';
import { BandSettingsSaveAction } from './BandSettingsSaveAction';

const band: BandDetail = {
  id: 'a8c6b7b1-0f0a-4e3a-8a0c-4f6ef3d2d9c1',
  name: '신촌 락밴드',
  description: null,
  visibility: true,
  coverImgUrl: null,
  bandMasterUserId: 'user-001',
  genres: [],
  memberCount: 4,
  createdAt: '2026-03-01T12:00:00.000+09:00',
};

/** 헤더의 저장 버튼은 라우터 밖에서 렌더되므로 폼과 함께 붙여 상호작용을 확인한다. */
const renderSettings = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BandSettingsSaveAction />
      <BandBasicSettings band={band} />
    </QueryClientProvider>,
  );
};

describe('BandBasicSettings', () => {
  it('밴드 값을 폼 초기값으로 채운다', () => {
    renderSettings();

    expect(screen.getByLabelText('밴드 이름')).toHaveValue('신촌 락밴드');
    expect(screen.getByRole('button', { name: '공개' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('변경 전에는 저장을 누를 수 없다', () => {
    renderSettings();

    expect(screen.getByRole('button', { name: /저장/ })).toBeDisabled();
  });

  it('이름을 바꾸면 저장이 활성된다', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.type(screen.getByLabelText('밴드 이름'), ' 2기');

    expect(screen.getByRole('button', { name: /저장/ })).toBeEnabled();
  });

  it('이름을 비우면 저장을 막는다', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.clear(screen.getByLabelText('밴드 이름'));

    expect(screen.getByRole('button', { name: /저장/ })).toBeDisabled();
  });

  it('공개 여부를 비공개로 바꾸면 저장이 활성된다', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole('button', { name: '비공개' }));

    expect(screen.getByRole('button', { name: '비공개' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: /저장/ })).toBeEnabled();
  });

  it('밴드 나가기는 확인 다이얼로그를 먼저 띄운다', async () => {
    const user = userEvent.setup();
    renderSettings();

    await user.click(screen.getByRole('button', { name: '밴드 나가기' }));

    expect(await screen.findByText('밴드를 나갈까요?')).toBeInTheDocument();
  });
});

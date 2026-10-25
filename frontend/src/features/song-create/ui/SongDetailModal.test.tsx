import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { SongListItem } from '@/entities/song/model/types';
import { SongDetailModal } from './SongDetailModal';

const sampleSong: SongListItem = {
  id: 'song-1',
  bandId: 'band-1',
  title: 'Wonderwall',
  artistName: 'Oasis',
  key: 'C',
  bpm: 120,
  difficultyLevel: null,
  sourceUrl: null,
  sourceType: null,
  externalTrackId: null,
  songCoverUrl: null,
  songLength: 277,
  externalLinks: [],
  referenceFiles: [],
  createdAt: '2026-10-18T00:00:00Z',
  skills: [],
};

const renderModal = (props: Partial<Parameters<typeof SongDetailModal>[0]> = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onOpenChange = vi.fn();
  const result = render(
    <QueryClientProvider client={queryClient}>
      <SongDetailModal
        open={true}
        onOpenChange={onOpenChange}
        song={sampleSong}
        {...props}
      />
    </QueryClientProvider>,
  );
  return { ...result, onOpenChange };
};

describe('SongDetailModal', () => {
  it('모달이 열리면 헤더에 곡명과 뒤로 가기 버튼을 렌더링한다', () => {
    renderModal();
    expect(screen.getByRole('button', { name: '뒤로 가기' })).toBeInTheDocument();
    expect(screen.getByText('Wonderwall', { selector: 'header *' })).toBeInTheDocument();
  });

  it('하단 확인 버튼을 누르면 onOpenChange(false)를 호출한다', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderModal();

    await user.click(screen.getByRole('button', { name: '확인' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('뒤로 가기 버튼을 누르면 onOpenChange(false)를 호출한다', async () => {
    const user = userEvent.setup();
    const { onOpenChange } = renderModal();

    await user.click(screen.getByRole('button', { name: '뒤로 가기' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('하단 수정 버튼이 렌더링되고 클릭 시 수정 모드로 전환된다', async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole('button', { name: '수정' }));
    expect(screen.getByText('합주곡 수정')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소' })).toBeInTheDocument();
  });

  it('canDelete가 true이면 곡 삭제 버튼이 노출되고 클릭 시 확인 다이얼로그를 띄운다', async () => {
    const user = userEvent.setup();
    renderModal({ canDelete: true });

    const deleteBtn = screen.getByRole('button', { name: /곡 삭제/i });
    expect(deleteBtn).toBeInTheDocument();

    await user.click(deleteBtn);
    expect(screen.getByText('합주곡을 삭제하시겠습니까?')).toBeInTheDocument();
  });

  it('canDelete가 false이면 곡 삭제 버튼이 노출되지 않는다', () => {
    renderModal({ canDelete: false });
    expect(screen.queryByRole('button', { name: /곡 삭제/i })).toBeNull();
  });
});

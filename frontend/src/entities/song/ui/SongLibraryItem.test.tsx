import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { SongListItem } from '../model/types';
import { SongLibraryItem } from './SongLibraryItem';

const song: SongListItem = {
  id: 'song-1',
  bandId: 'band-1',
  title: '건널목',
  artistName: 'Whiteusedsocks',
  key: null,
  bpm: null,
  difficultyLevel: null,
  sourceUrl: null,
  sourceType: null,
  externalTrackId: null,
  songCoverUrl: null,
  songLength: null,
  externalLinks: [],
  referenceFiles: [],
  createdAt: '2026-05-01T00:00:00+09:00',
  skills: [],
};

// 미리듣기는 externalTrackId로 트랙을 따로 조회하므로 query provider가 필요하다.
const renderItem = (item: SongListItem = song) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SongLibraryItem song={item} />
    </QueryClientProvider>,
  );
};

describe('SongLibraryItem', () => {
  it('곡 제목과 아티스트명을 props에서 렌더링한다', () => {
    renderItem();
    expect(screen.getByText('건널목')).toBeInTheDocument();
    expect(screen.getByText('Whiteusedsocks')).toBeInTheDocument();
  });

  it('커버 이미지가 없으면 커버 이미지를 렌더링하지 않는다', () => {
    const { container } = renderItem();
    expect(container.querySelector('img')).toBeNull();
  });

  it('커버 이미지가 있으면 커버 이미지를 렌더링한다', () => {
    const { container } = renderItem({
      ...song,
      songCoverUrl: 'https://example.com/cover.jpg',
    });
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.com/cover.jpg',
    );
  });

  it('외부 트랙 ID가 없으면 재생 버튼을 노출하지 않는다', () => {
    renderItem();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('외부 트랙 ID가 있으면 재생을 누른 뒤 미리듣기를 불러온다', async () => {
    const user = userEvent.setup();
    renderItem({ ...song, externalTrackId: 'track-1' });

    await user.click(screen.getByRole('button', { name: '건널목 미리듣기' }));

    expect(
      await screen.findByRole('button', { name: '건널목 미리듣기' }),
    ).toBeInTheDocument();
  });
});

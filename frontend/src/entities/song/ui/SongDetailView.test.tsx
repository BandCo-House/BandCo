import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { SongListItem } from '../model/types';
import { SongDetailView } from './SongDetailView';

const sampleSong: SongListItem = {
  id: 'song-1',
  bandId: 'band-1',
  title: 'Wonderwall',
  artistName: 'Oasis',
  key: 'C',
  bpm: 120,
  difficultyLevel: null,
  sourceUrl: 'https://spotify.com/track/123',
  sourceType: 'SPOTIFY',
  externalTrackId: 'track-wonderwall',
  songCoverUrl: 'https://example.com/cover.jpg',
  songLength: 277, // 4:37
  externalLinks: ['https://www.youtube.com/watch?v=bx1Bh8ZvH84'],
  referenceFiles: [
    {
      id: 'ref-1',
      fileUrl: 'https://example.com/files/image_70.png',
      fileName: 'image_70.png',
      createdAt: '2026-10-18T00:00:00Z',
    },
  ],
  createdAt: '2026-10-18T00:00:00Z',
  skills: [],
};

const renderDetail = (song: SongListItem = sampleSong) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SongDetailView song={song} />
    </QueryClientProvider>,
  );
};

describe('SongDetailView', () => {
  it('곡 제목과 아티스트명을 렌더링한다', () => {
    renderDetail();
    expect(screen.getByRole('heading', { level: 2, name: 'Wonderwall' })).toBeInTheDocument();
    expect(screen.getByText('Oasis')).toBeInTheDocument();
  });

  it('조성, 재생시간, BPM 메타 정보를 올바르게 표시한다', () => {
    renderDetail();
    expect(screen.getByText('C Major')).toBeInTheDocument();
    expect(screen.getByText('4:37')).toBeInTheDocument();
    expect(screen.getByText('120 BPM')).toBeInTheDocument();
  });

  it('참고 자료 파일 목록을 다운로드 가능한 링크/버튼으로 표시한다', () => {
    renderDetail();
    expect(screen.getByText('image_70.png')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /image_70.png 다운로드/i })).toHaveAttribute(
      'href',
      'https://example.com/files/image_70.png',
    );
  });

  it('외부 링크를 새 창 링크로 표시한다', () => {
    renderDetail();
    const link = screen.getByRole('link', {
      name: 'https://www.youtube.com/watch?v=bx1Bh8ZvH84',
    });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('외부 트랙 ID가 있으면 미리듣기 재생 버튼을 렌더링한다', async () => {
    const user = userEvent.setup();
    renderDetail();
    const playButton = screen.getByRole('button', { name: 'Wonderwall 미리듣기' });
    expect(playButton).toBeInTheDocument();

    await user.click(playButton);
    expect(playButton).toBeInTheDocument();
  });

  it('참고 자료나 외부 링크가 없을 때 빈 안내 문구를 노출한다', () => {
    renderDetail({
      ...sampleSong,
      referenceFiles: [],
      externalLinks: [],
    });
    expect(screen.getByText('등록된 참고 자료가 없어요.')).toBeInTheDocument();
    expect(screen.getByText('등록된 외부 링크가 없어요.')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
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
  previewUrl: null,
  songCoverUrl: null,
  songLength: null,
  externalLinks: [],
  referenceFiles: [],
  createdAt: '2026-05-01T00:00:00+09:00',
  skills: [],
};

describe('SongLibraryItem', () => {
  it('곡 제목과 아티스트명을 props에서 렌더링한다', () => {
    render(<SongLibraryItem song={song} />);
    expect(screen.getByText('건널목')).toBeInTheDocument();
    expect(screen.getByText('Whiteusedsocks')).toBeInTheDocument();
  });

  it('커버 이미지가 없으면 커버 이미지를 렌더링하지 않는다', () => {
    const { container } = render(<SongLibraryItem song={song} />);
    expect(container.querySelector('img')).toBeNull();
  });

  it('커버 이미지가 있으면 커버 이미지를 렌더링한다', () => {
    const { container } = render(
      <SongLibraryItem
        song={{ ...song, songCoverUrl: 'https://example.com/cover.jpg' }}
      />,
    );
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.com/cover.jpg',
    );
  });
});

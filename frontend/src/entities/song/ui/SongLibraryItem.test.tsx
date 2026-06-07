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
  albumImageUrl: null,
  createdAt: '2026-05-01T00:00:00+09:00',
  skills: [],
};

describe('SongLibraryItem', () => {
  it('곡 제목과 아티스트명을 props에서 렌더링한다', () => {
    render(<SongLibraryItem song={song} />);
    expect(screen.getByText('건널목')).toBeInTheDocument();
    expect(screen.getByText('Whiteusedsocks')).toBeInTheDocument();
  });
});

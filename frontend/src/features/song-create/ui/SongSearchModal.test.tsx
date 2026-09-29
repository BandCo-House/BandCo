import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import * as songApi from '@/entities/song/api/song-api';
import type { SongPreview } from '@/entities/song/model/types';
import { SongSearchModal } from './SongSearchModal';

const TRACK: SongPreview = {
  externalTrackId: 't-1',
  title: '좋은 날',
  artistName: '아이유',
  albumName: 'Real',
  albumImageUrl: null,
  releaseDate: null,
  durationMs: 234_000,
  previewUrl: null,
  sourceUrl: 'https://example.com/t-1',
  sourceType: 'SPOTIFY',
};

const createQueryClient = () =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } });

const renderModal = (onManualEntry: () => void = vi.fn()) =>
  render(
    <QueryClientProvider client={createQueryClient()}>
      <SongSearchModal
        open
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
        onManualEntry={onManualEntry}
      />
    </QueryClientProvider>,
  );

const typeQuery = (value: string) =>
  fireEvent.change(
    screen.getByPlaceholderText('제목, 가수로 곡을 검색하세요'),
    {
      target: { value },
    },
  );

describe('SongSearchModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('결과가 있는 검색어를 늘려 재조회하는 동안 이전 결과를 유지한다', async () => {
    let release: (tracks: SongPreview[]) => void = () => {};
    vi.spyOn(songApi, 'searchTracks')
      .mockResolvedValueOnce([TRACK])
      .mockImplementationOnce(
        () => new Promise((resolve) => (release = resolve)),
      );

    renderModal();

    typeQuery('좋은');
    expect(await screen.findByText('좋은 날')).toBeInTheDocument();

    typeQuery('좋은 날');
    // 재조회 중에도 목록이 사라지지 않아야 한다. 사라지면 타이핑마다 화면이 깜빡인다.
    await waitFor(() =>
      expect(
        screen.getByText('좋은 날').closest('[aria-busy]'),
      ).toHaveAttribute('aria-busy', 'true'),
    );
    expect(screen.queryByText('검색 중이에요.')).not.toBeInTheDocument();

    release([TRACK]);
  });

  it('직전 결과가 빈 배열이면 재조회 중에 "결과 없음"을 보여주지 않는다', async () => {
    let release: (tracks: SongPreview[]) => void = () => {};
    vi.spyOn(songApi, 'searchTracks')
      .mockResolvedValueOnce([])
      .mockImplementationOnce(
        () => new Promise((resolve) => (release = resolve)),
      );

    renderModal();

    typeQuery('없는곡');
    expect(await screen.findByText('검색 결과가 없어요.')).toBeInTheDocument();

    // keepPreviousData가 빈 배열을 그대로 물려줘 query가 success 상태가 된다.
    // isLoading만 보면 응답도 오기 전에 "결과 없음 + 직접 입력하기"가 뜬다.
    typeQuery('없는곡이지만있을지도');
    expect(await screen.findByText('검색 중이에요.')).toBeInTheDocument();
    expect(screen.queryByText('검색 결과가 없어요.')).not.toBeInTheDocument();
    expect(
      screen.queryByText('찾는 곡이 없나요? 직접 입력하기'),
    ).not.toBeInTheDocument();

    release([TRACK]);
    expect(await screen.findByText('좋은 날')).toBeInTheDocument();
  });

  it('검색 결과가 있어도 목록 끝에서 직접 입력으로 넘어갈 수 있다', async () => {
    // 유명한 곡은 커버만 나오고 원곡이 없을 수 있어, 결과가 있다고 탈출구를 숨기면 안 된다.
    vi.spyOn(songApi, 'searchTracks').mockResolvedValue([TRACK]);
    const onManualEntry = vi.fn();

    renderModal(onManualEntry);

    typeQuery('좋은 날');
    expect(await screen.findByText('아이유')).toBeInTheDocument();

    fireEvent.click(screen.getByText('찾는 곡이 없나요? 직접 입력하기'));

    expect(onManualEntry).toHaveBeenCalledOnce();
  });
});

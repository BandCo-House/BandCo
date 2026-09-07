import { useState } from 'react';
import { useSearchTracks } from '@/entities/song/api/useSearchTracks';
import { formatSongLength } from '@/entities/song/lib/song-length';
import type { SongPreview } from '@/entities/song/model/types';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import {
  AppDialogContent,
  Dialog,
  AppDialogClose,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { EmptyState } from '@/shared/ui/empty-state';

interface SongSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 결과 행을 고르면 폼에 곡 정보를 채우고 모달을 닫는다. */
  onSelect: (track: SongPreview) => void;
  /** 검색 결과가 없을 때 제목·아티스트를 손으로 채우는 경로. */
  onManualEntry: (query: string) => void;
}

/**
 * 외부 음원에서 합주곡을 검색하는 모달.
 * 검색으로 고른 곡은 sourceUrl·앨범아트·곡 길이까지 함께 채워지고,
 * 검색에 없는 곡(커버·자작곡)은 직접 입력으로 빠져나간다.
 */
export const SongSearchModal = ({
  open,
  onOpenChange,
  onSelect,
  onManualEntry,
}: SongSearchModalProps) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  // 닫을 때 query만 비우면 debounce된 값이 300ms 더 남아, 다시 열었을 때
  // 빈 검색창 아래로 이전 검색어의 결과가 잠깐 보인다.
  const keyword = query.trim() ? debouncedQuery.trim() : '';

  const {
    data: tracks = [],
    isFetching,
    isError,
  } = useSearchTracks(keyword, open);

  // 열릴 때 이전 검색어를 비운다(effect 대신 렌더 중 파생).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setQuery('');
  }

  const hasKeyword = keyword.length > 0;

  const renderResults = () => {
    if (!hasKeyword) {
      return <EmptyState title="제목이나 가수로 곡을 검색하세요." />;
    }
    if (isFetching) return <EmptyState title="검색 중이에요." />;
    if (isError) {
      return <EmptyState title="곡을 검색하지 못했어요." />;
    }
    if (tracks.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 py-8">
          <EmptyState className="py-0" title="검색 결과가 없어요." />
          <button
            type="button"
            onClick={() => {
              onManualEntry(keyword);
              onOpenChange(false);
            }}
            className="typo-sm-sb text-primary underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
          >
            찾는 곡이 없나요? 직접 입력하기
          </button>
        </div>
      );
    }

    return tracks.map((track) => (
      <button
        key={`${track.sourceType}-${track.externalTrackId}`}
        type="button"
        onClick={() => {
          onSelect(track);
          onOpenChange(false);
        }}
        className="flex w-full items-center gap-2 rounded-md px-3 py-4 text-left focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="min-w-0 flex-[6] truncate typo-sm-sb text-grey-50">
          {track.title}
        </span>
        <span className="min-w-0 flex-[4] truncate typo-sm-sb text-grey-200">
          {track.artistName}
        </span>
        <span className="shrink-0 typo-sm-sb text-grey-200">
          {formatSongLength(Math.round(track.durationMs / 1000))}
        </span>
      </button>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent className="flex max-h-[70dvh] flex-col gap-10 px-5 pt-5 pb-8">
        <DialogDescription className="sr-only">
          제목이나 가수로 곡을 검색해 합주곡 정보를 채웁니다.
        </DialogDescription>

        <div className="relative z-10 flex items-start gap-8 py-1">
          <DialogTitle className="min-w-0 flex-1">곡 검색</DialogTitle>
          <AppDialogClose aria-label="곡 검색 닫기" className="text-grey-50" />
        </div>

        <Input
          isSearchBar
          variant="roundedFull"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="제목, 가수로 곡을 검색하세요"
          className="relative z-10 h-[54px] border-white/24 bg-grey-500/24 pl-12 typo-base-sb"
        />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-y-auto">
          {renderResults()}
        </div>
      </AppDialogContent>
    </Dialog>
  );
};

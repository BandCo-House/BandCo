import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';
import { searchSongPreviews, type SongPreview } from '../api/song-search-api';

type ProfileMusicSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (song: SongPreview) => void;
};

const formatDuration = (durationMs: number) => {
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export function ProfileMusicSearchDialog({
  open,
  onOpenChange,
  onSelect,
}: ProfileMusicSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SongPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const hasQuery = useMemo(() => query.trim().length > 0, [query]);
  const shouldShowResults = open && debouncedQuery.trim().length > 0;

  useEffect(() => {
    const timerId = window.setTimeout(() => setDebouncedQuery(query), 300);
    return () => window.clearTimeout(timerId);
  }, [query]);

  useEffect(() => {
    if (!open || !debouncedQuery.trim()) return;

    let ignore = false;
    const searchTimerId = window.setTimeout(() => {
      setIsLoading(true);

      searchSongPreviews(debouncedQuery)
        .then((items) => {
          if (!ignore) setResults(items);
        })
        .catch(() => {
          if (!ignore) setResults([]);
        })
        .finally(() => {
          if (!ignore) setIsLoading(false);
        });
    }, 0);

    return () => {
      ignore = true;
      window.clearTimeout(searchTimerId);
    };
  }, [debouncedQuery, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="backdrop-blur-none"
        className="overflow-hidden border-white/20 bg-white/24 p-8 text-grey-50 backdrop-blur-2xl"
        style={{
          borderWidth: '0.5px 1px 2px 0.5px',
          boxShadow: '0px 3px 6px 2px rgba(255,255,255,0.16)',
        }}
      >
        <DialogHeader className="flex-row items-center justify-between text-left">
          <DialogTitle className="text-2xl font-bold text-grey-50">
            곡 검색
          </DialogTitle>
          <button
            type="button"
            aria-label="곡 검색 닫기"
            onClick={() => onOpenChange(false)}
            className="flex size-10 items-center justify-center rounded-full border-0 text-grey-50 transition-colors hover:text-primary focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:text-primary"
          >
            <X className="size-8" />
          </button>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-6 size-7 -translate-y-1/2 text-grey-50" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목, 가수로 곡을 검색하세요"
            className="h-16 w-full rounded-full border border-grey-50/20 bg-white/24 pr-16 pl-18 typo-lg-sb text-grey-50 transition-colors outline-none placeholder:text-grey-200 focus:border-primary"
          />
          {hasQuery && (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border-0 text-grey-50 transition-colors hover:text-primary focus-visible:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none active:text-primary"
            >
              <X className="size-5" />
            </button>
          )}
        </div>

        <div className="flex min-h-64 flex-col gap-5 pt-8">
          {isLoading && (
            <p className="typo-sm-m text-grey-200">검색 중입니다.</p>
          )}
          {!isLoading &&
            shouldShowResults &&
            results.map((song) => (
              <button
                key={`${song.sourceType}-${song.externalTrackId}`}
                type="button"
                className="flex w-full items-center gap-4 py-1 text-left text-grey-50"
                onClick={() => {
                  onSelect(song);
                  onOpenChange(false);
                }}
              >
                <span className="min-w-0 flex-[6] truncate typo-base-sb">
                  {song.title}
                </span>
                <span className="min-w-0 flex-[4] truncate text-grey-200">
                  {song.artistName}
                </span>
                <span className="w-fit shrink-0 grow-0 text-grey-200">
                  {formatDuration(song.durationMs)}
                </span>
              </button>
            ))}
          {!isLoading && shouldShowResults && results.length === 0 && (
            <p className="typo-sm-m text-grey-200">검색 결과가 없습니다.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

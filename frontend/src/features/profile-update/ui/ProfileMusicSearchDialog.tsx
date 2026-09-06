import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import {
  AppDialogBody,
  AppDialogClose,
  AppDialogContent,
  AppDialogHeader,
  Dialog,
  DialogTitle,
} from '@/shared/ui/dialog';
import {
  searchProfileMusic,
  type ProfileMusicPreview,
} from '@/entities/profile/api/profile-music-api';

type ProfileMusicSearchDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (song: ProfileMusicPreview) => void;
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
  const [results, setResults] = useState<ProfileMusicPreview[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedQuery = useDebouncedValue(query);

  const hasQuery = useMemo(() => query.trim().length > 0, [query]);
  // 닫을 때 query만 비우면 debounce된 값은 300ms 더 남는다.
  // 그 사이 다시 열면 이전 검색어로 조회되므로 현재 입력이 비면 검색어도 없는 것으로 본다.
  const keyword = hasQuery ? debouncedQuery.trim() : '';
  const shouldShowResults = open && keyword.length > 0;

  useEffect(() => {
    if (!open || !keyword) return;

    let ignore = false;

    void Promise.resolve().then(() => {
      if (ignore) return;

      setIsLoading(true);

      searchProfileMusic(keyword)
        .then((items) => {
          if (!ignore) setResults(items);
        })
        .catch(() => {
          if (!ignore) setResults([]);
        })
        .finally(() => {
          if (!ignore) setIsLoading(false);
        });
    });

    return () => {
      ignore = true;
    };
  }, [keyword, open]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setQuery('');
      setResults([]);
      setIsLoading(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <AppDialogContent className="p-8 text-grey-50">
        <AppDialogClose aria-label="곡 검색 닫기" />
        <AppDialogHeader>
          <DialogTitle>곡 검색</DialogTitle>
        </AppDialogHeader>

        <AppDialogBody className="gap-0">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-6 size-7 -translate-y-1/2 text-grey-50" />
            <input
              aria-label="곡 검색: 제목 또는 가수"
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
              <p className="typo-sm-sb text-grey-200">검색 중입니다.</p>
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
              <p className="typo-sm-sb text-grey-200">검색 결과가 없습니다.</p>
            )}
          </div>
        </AppDialogBody>
      </AppDialogContent>
    </Dialog>
  );
}

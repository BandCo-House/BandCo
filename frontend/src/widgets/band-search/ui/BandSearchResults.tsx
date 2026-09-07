import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { SearchBandItem } from '@/entities/band/model/types';
import { EmptyState } from '@/shared/ui/empty-state';

interface BandSearchResultsProps {
  bands: SearchBandItem[];
  isLoading: boolean;
  isError: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onFetchNextPage?: () => void;
}

export const BandSearchResults = ({
  bands,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
}: BandSearchResultsProps) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!sentinelRef.current || !hasNextPage || !onFetchNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          onFetchNextPage();
        }
      },
      { rootMargin: '150px' },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onFetchNextPage]);

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 px-5 py-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="flex w-full animate-pulse gap-2">
            <div className="h-[150px] w-[120px] rounded-[10.6px] bg-white/10" />
            <div className="flex flex-1 flex-col gap-2 pt-2">
              <div className="h-4 w-24 rounded bg-white/10" />
              <div className="h-10 w-full rounded bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        className="h-40"
        title="검색 중 오류가 발생했습니다."
        description="잠시 후 다시 시도해 주세요."
      />
    );
  }

  if (bands.length === 0) {
    return (
      <EmptyState
        className="h-40"
        title="검색 결과가 없습니다."
        description="다른 검색어로 시도해 보세요."
      />
    );
  }

  return (
    <div className="flex flex-col gap-5 px-5 py-4">
      {bands.map((band) => {
        const id = band.bandId || band.id || '';
        const hasValidImage = band.coverImgUrl && !failedImages[id];

        return (
          <Link
            key={id}
            to="/band/$bandId"
            params={{ bandId: id }}
            className="group flex w-full items-start gap-2 transition-opacity hover:opacity-90 active:scale-[0.99]"
          >
            {/* Left: Poster Card (Figma Node 1604:15779) */}
            <div className="flex w-[120.9px] shrink-0 flex-col items-center gap-2 rounded-[10.6px] border border-[rgba(220,226,249,0.4)] bg-white p-[4px] pb-3 shadow-sm">
              <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-[10.6px] bg-grey-200 typo-base-b text-[#1b1b32]">
                {hasValidImage ? (
                  <img
                    src={band.coverImgUrl!}
                    alt={band.name}
                    onError={() => handleImageError(id)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  band.name.slice(0, 2)
                )}
              </div>

              <p className="w-full truncate px-1 text-center typo-base-sb text-grey-600">
                {band.name}
              </p>
            </div>

            {/* Right: Info (Figma Node 1604:15780) */}
            <div className="flex flex-1 flex-col gap-2 p-[4px] text-grey-200">
              <div className="flex items-center gap-2 typo-xs-sb text-grey-200">
                <span>멤버 {band.memberCount ?? 0}명</span>
              </div>

              {band.description && (
                <p className="line-clamp-3 typo-sm-r text-grey-200">
                  {band.description}
                </p>
              )}

              {band.genres && band.genres.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {band.genres.map((g) => (
                    <span
                      key={g.id}
                      className="rounded bg-white/10 px-1.5 py-0.5 typo-xs-r text-grey-200"
                    >
                      #{g.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        );
      })}

      {/* Sentinel for Infinite Scroll Observation */}
      <div ref={sentinelRef} className="h-4 w-full" />

      {/* Next page loading spinner/skeleton indicator */}
      {isFetchingNextPage && (
        <div className="flex w-full items-center justify-center py-4 typo-sm-r text-grey-300">
          <span className="animate-pulse">다음 결과를 불러오는 중...</span>
        </div>
      )}
    </div>
  );
};

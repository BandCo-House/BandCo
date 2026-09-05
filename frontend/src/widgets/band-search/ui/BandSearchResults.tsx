import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { SearchBandItem } from '@/entities/band/model/types';

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
      <div className="flex h-40 w-full flex-col items-center justify-center gap-1 text-sm text-[#9D9D9F]">
        <p>검색 중 오류가 발생했습니다.</p>
        <p className="text-xs">잠시 후 다시 시도해 주세요.</p>
      </div>
    );
  }

  if (bands.length === 0) {
    return (
      <div className="flex h-40 w-full flex-col items-center justify-center gap-1 text-sm text-[#9D9D9F]">
        <p className="font-medium text-white/80">검색 결과가 없습니다.</p>
        <p className="text-xs">다른 검색어로 시도해 보세요.</p>
      </div>
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
              <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-[10.6px] bg-[#c6c6c8] font-['SUIT'] text-base font-bold text-[#1b1b32]">
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

              <p className="w-full truncate px-1 text-center font-['SUIT'] text-[12px] leading-[1.4] font-semibold text-black">
                {band.name}
              </p>
            </div>

            {/* Right: Info (Figma Node 1604:15780) */}
            <div className="flex flex-1 flex-col gap-2 p-[4px] font-['SUIT'] text-[12px] leading-[1.4] text-[#c6c6c8]">
              <div className="flex items-center gap-2 font-semibold text-[#c6c6c8]">
                <span>멤버 {band.memberCount ?? 0}명</span>
              </div>

              {band.description && (
                <p className="line-clamp-3 font-normal text-[#c6c6c8]">
                  {band.description}
                </p>
              )}

              {band.genres && band.genres.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {band.genres.map((g) => (
                    <span
                      key={g.id}
                      className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-[#c6c6c8]"
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
        <div className="flex w-full items-center justify-center py-4 text-xs text-[#9D9D9F]">
          <span className="animate-pulse">다음 결과를 불러오는 중...</span>
        </div>
      )}
    </div>
  );
};

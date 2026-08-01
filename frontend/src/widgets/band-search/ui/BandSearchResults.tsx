import { Link } from '@tanstack/react-router';
import { Users } from 'lucide-react';
import type { SearchBandItem } from '@/entities/band/model/types';

interface BandSearchResultsProps {
  bands: SearchBandItem[];
  isLoading: boolean;
  isError: boolean;
}

export const BandSearchResults = ({
  bands,
  isLoading,
  isError,
}: BandSearchResultsProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 px-5 py-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="h-24 w-full animate-pulse rounded-2xl border border-white/10 bg-white/5"
          />
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
    <div className="flex flex-col gap-3 px-5 py-4">
      {bands.map((band) => (
        <Link
          key={band.id}
          to="/band/$bandId"
          params={{ bandId: band.id }}
          className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition-all hover:bg-white/10 active:scale-[0.99]"
        >
          {/* Cover image or fallback */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/30 bg-primary/20 text-lg font-bold text-primary">
            {band.coverImgUrl ? (
              <img
                src={band.coverImgUrl}
                alt={band.name}
                className="h-full w-full object-cover"
              />
            ) : (
              band.name.slice(0, 2)
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-base font-semibold text-white transition-colors group-hover:text-primary">
                {band.name}
              </h3>
              <div className="flex items-center gap-1 text-xs text-[#9CA578]">
                <Users size={12} />
                <span>멤버 {band.memberCount ?? 0}명</span>
              </div>
            </div>

            {band.description && (
              <p className="line-clamp-2 text-xs font-normal text-[#9D9D9F]">
                {band.description}
              </p>
            )}

            {band.genres && band.genres.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {band.genres.map((g) => (
                  <span
                    key={g.id}
                    className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/80"
                  >
                    #{g.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
};

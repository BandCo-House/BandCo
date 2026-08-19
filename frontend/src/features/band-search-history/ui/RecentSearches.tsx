import { X as XIcon } from 'lucide-react';

interface RecentSearchesProps {
  searches: string[];
  onSelectSearch: (query: string) => void;
  onRemoveSearch: (query: string) => void;
  onClearAll: () => void;
}

export const RecentSearches = ({
  searches,
  onSelectSearch,
  onRemoveSearch,
  onClearAll,
}: RecentSearchesProps) => {
  if (searches.length === 0) {
    return (
      <div className="flex h-32 w-full flex-col items-center justify-center text-sm text-[#9D9D9F]">
        최근 검색어가 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full px-5 py-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-[#9D9D9F]">
          최근 검색어
        </span>
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-[#9D9D9F] underline hover:opacity-80"
        >
          전체 삭제
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {searches.map((term) => (
          <div
            key={term}
            className="flex items-center justify-between border-b border-white/10 py-1.5"
          >
            <button
              type="button"
              onClick={() => onSelectSearch(term)}
              className="min-w-0 flex-1 truncate text-start text-sm font-medium text-white transition-opacity hover:opacity-80"
            >
              {term}
            </button>
            <button
              type="button"
              onClick={() => onRemoveSearch(term)}
              className="p-1 text-[#9D9D9F] hover:text-white"
              aria-label={`${term} 최근 검색어 삭제`}
            >
              <XIcon size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

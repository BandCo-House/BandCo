import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Search as SearchIcon, X } from 'lucide-react';
import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { useRecentSearches } from '@/features/band-search-history/model/useRecentSearches';
import { RecentSearches } from '@/features/band-search-history/ui/RecentSearches';
import { useBandSearch } from '@/entities/band/api/useBandSearch';
import { BandSearchResults } from '@/widgets/band-search/ui/BandSearchResults';

export const Route = createFileRoute('/search')({
  component: SearchPage,
  staticData: {
    fullBleed: true,
  },
});

function SearchPage() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

  const { searches, addSearch, removeSearch, clearAll } = useRecentSearches();

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBandSearch({
    keyword: submittedQuery,
  });

  const searchResults = data?.pages.flatMap((page) => page.items) ?? [];

  const handleSearchSubmit = (queryToSubmit: string) => {
    const trimmed = queryToSubmit.trim();
    if (!trimmed) return;
    setInputValue(trimmed);
    setSubmittedQuery(trimmed);
    addSearch(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit(inputValue);
    }
  };

  const handleClearInput = () => {
    setInputValue('');
    setSubmittedQuery('');
  };

  return (
    <div className="w-full pb-20" data-testid="search-page">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearchSubmit(inputValue);
        }}
        className="sticky top-0 z-30 flex min-h-16 items-center gap-3 px-5 py-2.5 backdrop-blur-md"
      >
        <button
          type="button"
          onClick={() => navigate({ to: '..' })}
          aria-label="뒤로 가기"
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-foreground focus-visible:outline-2 focus-visible:outline-key"
        >
          <ArrowRightIcon
            aria-hidden="true"
            data-slot="svg-icon"
            className="size-6 rotate-180"
          />
        </button>
        <div className="relative flex h-[42px] flex-1 items-center rounded-full bg-[rgba(220,226,249,0.4)] focus-within:ring-2 focus-within:ring-primary">
          <SearchIcon
            size={16}
            className="pointer-events-none absolute left-[14px] text-[#C6C6C8]"
          />
          <input
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="밴드/사용자를 찾아보세요"
            className="h-full w-full rounded-full bg-transparent pr-[36px] pl-[38px] text-sm text-white placeholder-[#C6C6C8] outline-none [&::-webkit-search-cancel-button]:hidden"
          />

          {inputValue && (
            <button
              type="button"
              onClick={handleClearInput}
              className="absolute right-[12px] p-1 text-[#9D9D9F] transition-colors hover:text-white"
              aria-label="입력 초기화"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="flex h-[42px] shrink-0 items-center justify-center rounded-full bg-[#ECFCAB] px-5 text-base font-semibold text-black transition-opacity hover:opacity-90 active:opacity-80"
        >
          검색
        </button>
      </form>

      {!submittedQuery ? (
        <RecentSearches
          searches={searches}
          onSelectSearch={handleSearchSubmit}
          onRemoveSearch={removeSearch}
          onClearAll={clearAll}
        />
      ) : (
        <BandSearchResults
          bands={searchResults}
          isLoading={isLoading}
          isError={isError}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onFetchNextPage={fetchNextPage}
        />
      )}
    </div>
  );
}

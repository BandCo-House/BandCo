import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Search as SearchIcon, X } from 'lucide-react';
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
        className="sticky top-0 z-30 flex min-h-[64px] items-center gap-[10px] py-2.5 pr-[20px] pl-[10px] backdrop-blur-md"
      >
        {/* 뒤로가기 버튼 */}
        <button
          type="button"
          onClick={() => navigate({ to: '..' })}
          className="flex h-[42px] w-[32px] items-center justify-center text-white transition-opacity hover:opacity-80"
          aria-label="뒤로 가기"
        >
          <ArrowLeft size={24} />
        </button>

        {/* 검색어 입력창 (Searchbar) */}
        <div className="relative flex h-[42px] flex-1 items-center rounded-full border-[1.5px] border-[#9CA578] bg-[rgba(220,226,249,0.4)]">
          {/* 돋보기 아이콘 (Left) */}
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

        {/* "검색" 버튼 (Inbtn1) */}
        <button
          type="submit"
          className="flex h-[42px] shrink-0 items-center justify-center rounded-full bg-[#ECFCAB] px-5 text-base font-semibold text-black transition-opacity hover:opacity-90 active:opacity-80"
        >
          검색
        </button>
      </form>

      {/* Main Content: Recent Searches or Band Search Results */}
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

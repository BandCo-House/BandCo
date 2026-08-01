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
    header: {
      title: '검색',
      showBack: false,
    },
  },
});

function SearchPage() {
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');

  const { searches, addSearch, removeSearch, clearAll } = useRecentSearches();

  const { data, isLoading, isError } = useBandSearch({
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
      {/* Top Header & Searchbar */}
      <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate({ to: '..' })}
          className="p-1 text-white hover:opacity-80"
          aria-label="뒤로 가기"
        >
          <ArrowLeft size={22} />
        </button>

        <div className="relative flex flex-1 items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="밴드 이름으로 검색해보세요"
            className="w-full rounded-full border border-white/20 bg-white/10 px-4 py-2 pr-9 text-sm text-white placeholder-[#9D9D9F] transition-colors outline-none focus:border-primary"
          />
          {inputValue && (
            <button
              type="button"
              onClick={handleClearInput}
              className="absolute right-3 p-1 text-[#9D9D9F] hover:text-white"
              aria-label="입력 초기화"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleSearchSubmit(inputValue)}
          className="flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-black transition-opacity hover:opacity-90 active:opacity-80"
        >
          <SearchIcon size={14} />
          검색
        </button>
      </div>

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
        />
      )}
    </div>
  );
}

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
    // 자체 상단 검색바가 sticky top-0에 붙어야 해서 세로 여백까지 직접 관리한다
    bleed: 'all',
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

  // 하단 네비 여백은 RootLayout의 mb가 이미 확보한다 — 여기서 또 주면 빈 스크롤이 생긴다.
  return (
    <div className="w-full" data-testid="search-page">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearchSubmit(inputValue);
        }}
        // 공통 RouteHeader와 같은 프로스트+글로우로 맞춘다(검색은 입력창 때문에 커스텀 헤더).
        // RouteHeader는 fixed top-0이라 safe area를 자기 패딩으로 먹지만, 이 바는 main
        // 안에 있어 main의 pt(safe area) 아래에서 시작했다. 그 위 빈 띠에 글로우(위로 32px
        // 번진다)가 그대로 보여 다른 헤더엔 없는 그림자가 생겼다. 음수 마진으로 그 띠까지
        // 덮어 화면 끝에 붙인다 — 글로우가 번질 자리가 없어진다.
        className="sticky top-0 z-30 -mt-[env(safe-area-inset-top)] flex min-h-19 items-center gap-3 bg-gradient-top/65 px-5 pt-[calc(1rem_+_env(safe-area-inset-top))] pb-4 header-glow backdrop-blur-sm"
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
        <div className="relative flex h-11 flex-1 items-center rounded-full bg-surface-1/50 glass-surface focus-within:ring-2 focus-within:ring-primary">
          <SearchIcon
            size={16}
            className="pointer-events-none absolute left-[14px] text-grey-200"
          />
          <input
            type="search"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="밴드/사용자를 찾아보세요"
            // iOS는 글자가 16px 미만인 입력에 포커스하면 화면을 자동으로 확대한다.
            // 확대가 한 번 걸리면 레이아웃 뷰포트가 어긋나 fixed 바텀 네비 아래 빈 공간이
            // 남고, 라우트를 옮겨도 그대로다. maximum-scale로 막으면 사용자 핀치 줌까지
            // 막혀 접근성(WCAG 1.4.4) 위반이라 글자 크기로 푼다.
            className="h-full w-full rounded-full bg-transparent pr-[36px] pl-[38px] typo-base-r text-grey-50 placeholder-grey-200 outline-none [&::-webkit-search-cancel-button]:hidden"
          />

          {inputValue && (
            <button
              type="button"
              onClick={handleClearInput}
              className="absolute right-[12px] p-1 text-grey-300 transition-colors hover:text-grey-50"
              aria-label="입력 초기화"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="flex h-[42px] shrink-0 items-center justify-center rounded-full bg-primary px-5 typo-base-sb text-grey-600 transition-opacity hover:opacity-90 active:opacity-80"
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

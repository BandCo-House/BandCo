import { useState } from 'react';
import type { PlaceSearchResult } from '@/entities/place/api/place-search-api';
import { useSearchPlaces } from '@/entities/place/api/useSearchPlaces';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { cn } from '@/shared/lib/utils';
import {
  AppDialogClose,
  AppDialogContent,
  Dialog,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/dialog';
import { EmptyState } from '@/shared/ui/empty-state';
import { Input } from '@/shared/ui/input';

interface PlaceSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 결과 행을 고르면 폼에 위치(주소·좌표)를 채우고 모달을 닫는다. */
  onSelect: (place: PlaceSearchResult) => void;
}

/**
 * 지도에서 연습 장소 위치를 찾는 모달.
 * 도로명주소를 외워서 치는 대신 "합정 ○○합주실"처럼 상호명으로 찾게 한다.
 * 검색에 없는 곳(동아리방 등)은 이 모달을 닫고 이름·상세 위치만 적으면 된다.
 */
export const PlaceSearchModal = ({
  open,
  onOpenChange,
  onSelect,
}: PlaceSearchModalProps) => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  // 닫을 때 query만 비우면 debounce된 값이 300ms 더 남아, 다시 열었을 때
  // 빈 검색창 아래로 이전 검색어의 결과가 잠깐 보인다.
  const keyword = query.trim() ? debouncedQuery.trim() : '';

  const {
    data: places = [],
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
  } = useSearchPlaces(keyword, open);

  // 열릴 때 이전 검색어를 비운다(effect 대신 렌더 중 파생).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setQuery('');
  }

  const renderResults = () => {
    if (keyword.length === 0) {
      return <EmptyState title="합주실 이름이나 주소로 검색하세요." />;
    }
    // 직전 결과가 빈 배열이면 keepPreviousData가 그대로 물려줘 isLoading이 false가 된다.
    // 응답 전에 "결과 없음"이 뜨지 않게 그 경우도 검색 중으로 본다.
    const hasNothingToShow = isPlaceholderData && places.length === 0;
    if (isLoading || hasNothingToShow) {
      return <EmptyState title="검색 중이에요." />;
    }
    if (isError) {
      return (
        <EmptyState
          title="장소를 검색하지 못했어요."
          description="잠시 후 다시 시도해주세요."
        />
      );
    }
    if (places.length === 0) {
      return (
        <EmptyState
          title="검색 결과가 없어요."
          description="지도에 없는 곳은 이름과 상세 위치만 적어도 돼요."
        />
      );
    }

    return places.map((place) => (
      <button
        key={place.id}
        type="button"
        onClick={() => {
          onSelect(place);
          onOpenChange(false);
        }}
        // 두 줄짜리 행이라 구분선이 없으면 어느 주소가 어느 상호의 것인지 붙어 보인다.
        className="flex w-full flex-col gap-1 border-b border-grey-50/10 px-3 py-4 text-left last:border-b-0 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="w-full truncate typo-sm-sb text-grey-50">
          {place.name}
        </span>
        <span className="w-full truncate typo-sm-r text-grey-200">
          {place.address}
        </span>
      </button>
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent size="full" className="max-h-[70dvh] gap-10">
        <DialogDescription className="sr-only">
          합주실 이름이나 주소로 검색해 연습 장소의 위치를 채웁니다.
        </DialogDescription>

        <div className="relative z-10 flex items-start gap-8 py-1">
          <DialogTitle className="min-w-0 flex-1">위치 검색</DialogTitle>
          <AppDialogClose
            aria-label="위치 검색 닫기"
            className="text-grey-50"
          />
        </div>

        <Input
          isSearchBar
          variant="roundedFull"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="합주실 이름, 주소로 검색하세요"
          className="relative z-10 h-[54px] border-white/24 bg-grey-500/24 pl-12 typo-base-sb"
        />

        {/* 갱신 중에는 목록을 지우는 대신 흐리게 둔다(곡 검색과 같은 규칙). */}
        <div
          aria-busy={isFetching}
          className={cn(
            'relative z-10 flex min-h-0 scrollbar-glass flex-1 flex-col overflow-y-auto transition-opacity',
            isFetching && !isLoading && 'opacity-50',
          )}
        >
          {renderResults()}
        </div>
      </AppDialogContent>
    </Dialog>
  );
};

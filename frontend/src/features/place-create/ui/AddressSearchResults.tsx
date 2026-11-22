import { cn } from '@/shared/lib/utils';
import type {
  PlaceSearchResult,
  PlaceSearchStatus,
} from '../model/useKakaoPlaceSearch';

interface AddressSearchResultsProps {
  status: PlaceSearchStatus;
  results: PlaceSearchResult[];
  selectedId: string | null;
  onSelect: (place: PlaceSearchResult) => void;
}

const StatusMessage = ({ children }: { children: string }) => (
  <p className="py-8 text-center typo-sm-r text-grey-300">{children}</p>
);

/**
 * 주소 검색 결과 목록 및 상태(대기/로딩/에러/빈 결과)를 표시하는 컴포넌트.
 */
export const AddressSearchResults = ({
  status,
  results,
  selectedId,
  onSelect,
}: AddressSearchResultsProps) => (
  <section aria-label="검색 결과 목록" className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="typo-sm-sb text-grey-200">
        {status === 'success' ? `검색 결과 (${results.length}건)` : '검색 결과'}
      </span>
      {selectedId && (
        <span className="typo-xs-r text-primary">
          ✓ 장소가 선택되었습니다
        </span>
      )}
    </div>

    <div
      role="listbox"
      aria-label="주소 검색 결과"
      className="scrollbar-glass flex max-h-[180px] min-h-[110px] flex-col gap-2 overflow-y-auto rounded-xl border border-white/10 bg-surface-2/40 p-2"
    >
      {status === 'idle' && (
        <StatusMessage>
          연습 장소의 이름이나 주소를 검색해보세요.
        </StatusMessage>
      )}
      {status === 'loading' && <StatusMessage>검색하고 있어요...</StatusMessage>}
      {status === 'empty' && (
        <StatusMessage>검색 결과가 없어요.</StatusMessage>
      )}
      {status === 'error' && (
        <StatusMessage>
          검색하지 못했어요. 잠시 후 다시 시도해주세요.
        </StatusMessage>
      )}
      {status === 'success' &&
        results.map((place) => {
          const isSelected = selectedId === place.id;
          return (
            <button
              key={place.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(place)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-[16px] border bg-surface-3 px-3.5 py-2.5 text-left transition-colors',
                isSelected
                  ? 'border-primary shadow-[0_0_12px_rgba(236,252,171,0.25)]'
                  : 'border-surface-2 hover:border-grey-300',
              )}
            >
              <span className="typo-sm-sb break-keep text-grey-50">
                {place.name}
              </span>
              <span className="typo-xs-r break-keep text-grey-200">
                {place.address}
              </span>
            </button>
          );
        })}
    </div>
  </section>
);

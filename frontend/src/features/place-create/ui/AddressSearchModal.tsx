import { useState, type FormEvent } from 'react';
import { Map, MapMarker, useKakaoLoader } from 'react-kakao-maps-sdk';
import { Search } from 'lucide-react';
import { KAKAO_MAP_APP_KEY } from '@/shared/api/config';
import {
  Dialog,
  AppDialogBody,
  AppDialogClose,
  AppDialogContent,
  AppDialogHeader,
  DialogDescription,
  DialogTitle,
} from '@/shared/ui/dialog';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Field } from '@/shared/ui/field';
import { cn } from '@/shared/lib/utils';
import {
  useKakaoPlaceSearch,
  type PlaceSearchResult,
} from '../model/useKakaoPlaceSearch';

export interface AddressSelection {
  address: string;
  /** 사용자가 입력한 상세주소. 비어 있으면 빈 문자열. */
  detailAddress: string;
}

interface AddressSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (selection: AddressSelection) => void;
}

const StatusMessage = ({ children }: { children: string }) => (
  <p className="py-8 text-center typo-sm-r text-grey-300">{children}</p>
);

/**
 * 카카오맵 장소 검색 모달. 키워드로 장소를 찾고, 고른 위치를 지도에 표시한 뒤
 * 상세주소(선택)를 덧붙여 돌려준다.
 */
export const AddressSearchModal = ({
  open,
  onOpenChange,
  onSelect,
}: AddressSearchModalProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <AppDialogContent size="full" className="h-dvh gap-6 text-grey-50">
      <AppDialogHeader className="mb-0 items-center">
        <DialogTitle className="typo-lg-sb text-grey-50">주소 검색</DialogTitle>
        <AppDialogClose />
      </AppDialogHeader>
      <DialogDescription className="sr-only">
        장소 이름이나 주소로 검색해 연습 장소의 주소를 선택합니다.
      </DialogDescription>

      {KAKAO_MAP_APP_KEY ? (
        <AddressSearchBody
          onCancel={() => onOpenChange(false)}
          onConfirm={(selection) => {
            onSelect(selection);
            onOpenChange(false);
          }}
        />
      ) : (
        <StatusMessage>
          지도를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
        </StatusMessage>
      )}
    </AppDialogContent>
  </Dialog>
);

interface AddressSearchBodyProps {
  onCancel: () => void;
  onConfirm: (selection: AddressSelection) => void;
}

const DEFAULT_CENTER = { lat: 37.5665, lng: 126.978 };

/** 키가 있을 때만 마운트되어 SDK를 로드한다(모달이 닫히면 언마운트되어 상태도 초기화). */
const AddressSearchBody = ({ onCancel, onConfirm }: AddressSearchBodyProps) => {
  const [isSdkLoading, sdkError] = useKakaoLoader({
    appkey: KAKAO_MAP_APP_KEY,
    libraries: ['services'],
  });
  const { results, status, search } = useKakaoPlaceSearch();

  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<PlaceSearchResult | null>(null);
  const [detailAddress, setDetailAddress] = useState('');

  if (sdkError) {
    return (
      <StatusMessage>
        지도를 불러오지 못했어요. 잠시 후 다시 시도해주세요.
      </StatusMessage>
    );
  }
  if (isSdkLoading) {
    return <StatusMessage>지도를 불러오고 있어요...</StatusMessage>;
  }

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    search(keyword);
  };

  const mapCenter = selected
    ? { lat: selected.lat, lng: selected.lng }
    : DEFAULT_CENTER;

  return (
    <>
      <form
        role="search"
        onSubmit={handleSearch}
        className="relative z-10 flex shrink-0 items-center gap-2"
      >
        <div className="min-w-0 flex-1">
          <Input
            isSearchBar
            type="search"
            enterKeyHint="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="장소 이름이나 주소를 검색하세요"
            className="h-[54px] border-white/24 bg-grey-500/24 pl-12 typo-base-sb"
          />
        </div>
        <Button
          type="submit"
          variant="accent"
          className="h-[46px] gap-1 px-4 typo-base-b"
        >
          <Search aria-hidden="true" className="size-[18px]" />
          검색
        </Button>
      </form>

      <AppDialogBody className="gap-5">
        {/* 상단: 검색 결과 목록 영역 */}
        <section aria-label="검색 결과 목록" className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="typo-sm-sb text-grey-200">
              {status === 'success'
                ? `검색 결과 (${results.length}건)`
                : '검색 결과'}
            </span>
            {selected && (
              <span className="typo-xs-r text-primary">
                ✓ 장소가 선택되었습니다
              </span>
            )}
          </div>

          <div
            role="listbox"
            aria-label="주소 검색 결과"
            className="flex max-h-[180px] min-h-[110px] scrollbar-glass flex-col gap-2 overflow-y-auto rounded-xl border border-white/10 bg-surface-2/40 p-2"
          >
            {status === 'idle' && (
              <StatusMessage>
                연습 장소의 이름이나 주소를 검색해보세요.
              </StatusMessage>
            )}
            {status === 'loading' && (
              <StatusMessage>검색하고 있어요...</StatusMessage>
            )}
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
                const isSelected = selected?.id === place.id;
                return (
                  <button
                    key={place.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => setSelected(place)}
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

        {/* 하단: 지도 및 선택 장소 상세 영역 */}
        <section aria-label="지도 및 상세 정보" className="flex flex-col gap-3">
          <span className="typo-sm-sb text-grey-200">위치 확인</span>

          <div
            aria-hidden="true"
            className="h-[180px] w-full overflow-hidden rounded-2xl border border-white/10"
          >
            <Map center={mapCenter} isPanto level={3} className="size-full">
              {selected && (
                <MapMarker
                  position={{ lat: selected.lat, lng: selected.lng }}
                />
              )}
            </Map>
          </div>

          {selected ? (
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex flex-col gap-0.5">
                <p className="typo-base-sb break-keep text-grey-50">
                  {selected.name}
                </p>
                <p className="typo-sm-r break-keep text-grey-200">
                  {selected.address}
                </p>
              </div>
              <Field label="상세주소" htmlFor="place-detail-address">
                <Input
                  id="place-detail-address"
                  variant="underline"
                  value={detailAddress}
                  onChange={(event) => setDetailAddress(event.target.value)}
                  placeholder="동·호수 등 상세주소를 입력해주세요 (선택)"
                  maxLength={255}
                />
              </Field>
            </div>
          ) : (
            <p className="py-2 text-center typo-xs-r text-grey-300">
              목록에서 장소를 누르면 지도 위치가 이동하고 상세정보를 입력할 수
              있어요.
            </p>
          )}
        </section>
      </AppDialogBody>

      <div className="relative z-10 flex shrink-0 items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="border-grey-200 text-grey-100"
          onClick={onCancel}
        >
          취소
        </Button>
        <Button
          type="button"
          variant="shining"
          size="lg"
          disabled={!selected}
          onClick={() =>
            selected &&
            onConfirm({
              address: selected.address,
              detailAddress: detailAddress.trim(),
            })
          }
        >
          확인
        </Button>
      </div>
    </>
  );
};

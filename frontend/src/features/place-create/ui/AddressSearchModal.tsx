import { useState, type FormEvent } from 'react';
import { useKakaoLoader } from 'react-kakao-maps-sdk';
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
import { KakaoMap } from '@/shared/ui/kakao-map';
import { useKakaoPlaceSearch } from '../model/useKakaoPlaceSearch';
import { useAddressPicker } from '../model/useAddressPicker';
import { AddressSearchResults } from './AddressSearchResults';

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
 * 상세주소(선택)를 덧붙여 돌려준다. 지도 터치 및 핀 드래그로 위치를 직접 조정할 수도 있다.
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
        장소 이름이나 주소로 검색하거나 지도에서 위치를 선택해 연습 장소의 주소를 선택합니다.
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

/** 키가 있을 때만 마운트되어 SDK를 로드한다(모달이 닫히면 언마운트되어 상태도 초기화). */
const AddressSearchBody = ({ onCancel, onConfirm }: AddressSearchBodyProps) => {
  const [isSdkLoading, sdkError] = useKakaoLoader({
    appkey: KAKAO_MAP_APP_KEY,
    libraries: ['services'],
  });
  const { results, status, search } = useKakaoPlaceSearch();
  const {
    mapCenter,
    markerPosition,
    selectedResultId,
    selectedPlaceInfo,
    isResolvingAddress,
    canConfirm,
    selectResult,
    movePin,
  } = useAddressPicker();

  const [keyword, setKeyword] = useState('');
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
        <AddressSearchResults
          status={status}
          results={results}
          selectedId={selectedResultId}
          onSelect={selectResult}
        />

        {/* 하단: 지도 및 선택 장소 상세 영역 */}
        <section aria-label="지도 및 상세 정보" className="flex flex-col gap-3">
          <span className="typo-sm-sb text-grey-200">위치 확인</span>

          <KakaoMap
            center={mapCenter}
            className="h-[180px] w-full"
            marker={
              markerPosition
                ? {
                    position: markerPosition,
                    draggable: true,
                    onDragEnd: (pos) => void movePin(pos.lat, pos.lng),
                  }
                : null
            }
            onMapClick={(pos) => void movePin(pos.lat, pos.lng)}
          />

          {selectedPlaceInfo ? (
            <div className="flex flex-col gap-3 pt-1">
              <div className="flex flex-col gap-0.5">
                <p className="typo-base-sb break-keep text-grey-50">
                  {selectedPlaceInfo.name}
                </p>
                <p className="typo-sm-r break-keep text-grey-200">
                  {isResolvingAddress
                    ? '주소를 확인하고 있어요...'
                    : selectedPlaceInfo.address}
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
              장소를 검색하거나 지도에서 위치를 터치해 핀을 꽂아보세요.
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
          disabled={!canConfirm}
          onClick={() => {
            if (!canConfirm || !selectedPlaceInfo) return;
            onConfirm({
              address: selectedPlaceInfo.address,
              detailAddress: detailAddress.trim(),
            });
          }}
        >
          확인
        </Button>
      </div>
    </>
  );
};

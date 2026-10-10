import ArrowRightIcon from '@/assets/icons/arrow-right.svg?react';
import { isKakaoMapsAvailable } from '@/shared/lib/kakao-maps';
import { Button } from '@/shared/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/shared/ui/sheet';
import type { Place } from '../model/types';
import { PlaceStaticMap } from './PlaceStaticMap';

interface PlaceDetailSheetProps {
  open: boolean;
  /**
   * 보여줄 장소. 닫을 때 같이 비우지 않는다 — 비우면 시트가 내려가는 동안
   * 내용이 먼저 사라져 빈 화면이 닫히는 것처럼 보인다.
   */
  place: Place | null;
  onClose: () => void;
  /** 수정 화면으로 넘어간다. 수정 폼은 feature라 여기서 직접 열지 않는다. */
  onEdit: () => void;
}

/**
 * 연습 장소 상세(풀스크린). 이름·위치와, 지도 검색으로 고른 장소라면 지도를 보여준다.
 * 목록 응답에 필요한 값이 다 있어 상세를 따로 조회하지 않는다.
 */
export const PlaceDetailSheet = ({
  open,
  place,
  onClose,
  onEdit,
}: PlaceDetailSheetProps) => {
  // 좌표가 없는 장소("동방 1호")는 그릴 지도가 없어 섹션째로 뺀다.
  const coordinates =
    isKakaoMapsAvailable &&
    place !== null &&
    place.latitude !== null &&
    place.longitude !== null
      ? { latitude: place.latitude, longitude: place.longitude }
      : null;

  return (
    <Sheet
      open={open && place !== null}
      onOpenChange={(next) => !next && onClose()}
    >
      <SheetContent
        showCloseButton={false}
        className="inset-0 mx-auto flex h-full w-full max-w-[648px] flex-col gap-0 border-0 bg-gradient-to-b from-gradient-top to-gradient-bottom p-0 sm:max-w-[648px]"
      >
        <SheetDescription className="sr-only">
          연습 장소의 이름과 위치를 확인합니다.
        </SheetDescription>

        <header className="flex items-center gap-4 bg-gradient-top/65 py-3 pr-5 pl-2.5 header-glow backdrop-blur-sm">
          <button
            type="button"
            aria-label="뒤로 가기"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-full text-grey-50 focus-visible:outline-2 focus-visible:outline-key"
          >
            <ArrowRightIcon aria-hidden="true" className="size-6 rotate-180" />
          </button>
          <SheetTitle className="typo-lg-sb text-grey-50">연습 장소</SheetTitle>
        </header>

        {place && (
          // 블록 간격 24는 라이브러리 화면의 섹션 간격(gap-6)과 맞춘 값이다.
          <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-5">
            <div className="flex items-center gap-4 pt-4">
              {place.imageUrl && (
                <img
                  src={place.imageUrl}
                  alt=""
                  className="size-20 shrink-0 rounded-md border border-grey-50 object-cover opacity-80"
                />
              )}
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h2 className="typo-xl-sb break-words text-grey-50">
                  {place.name}
                </h2>
                {/* 주소와 상세 위치는 성격이 달라 줄을 나눈다(지도에 있는 곳 / 그 안에서 찾아가는 법). */}
                {place.address && (
                  <p className="typo-base-b break-words text-grey-300">
                    {place.address}
                  </p>
                )}
                {place.detailAddress && (
                  <p className="typo-base-b break-words text-grey-300">
                    {place.detailAddress}
                  </p>
                )}
              </div>
            </div>

            {coordinates && (
              <section className="flex flex-col gap-5 pb-8">
                <h3 className="typo-lg-b text-grey-50">위치</h3>
                <PlaceStaticMap name={place.name} {...coordinates} />
              </section>
            )}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 bg-gradient-top/65 px-5 py-4 pb-[calc(1rem_+_env(safe-area-inset-bottom))] footer-glow backdrop-blur-sm">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="border-grey-200 text-grey-100"
            disabled={!place}
            onClick={onEdit}
          >
            수정
          </Button>
          <Button type="button" variant="shining" size="lg" onClick={onClose}>
            확인
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

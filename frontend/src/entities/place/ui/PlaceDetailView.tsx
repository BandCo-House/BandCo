import { isKakaoMapsAvailable } from '@/shared/lib/kakao-maps';
import type { Place } from '../model/types';
import { PlaceStaticMap } from './PlaceStaticMap';

interface PlaceDetailViewProps {
  place: Place;
}

/**
 * 연습 장소 상세 본문. 이름·위치와, 지도 검색으로 고른 장소라면 지도를 보여준다.
 * 목록 응답에 필요한 값이 다 있어 상세를 따로 조회하지 않는다.
 */
export const PlaceDetailView = ({ place }: PlaceDetailViewProps) => {
  // 좌표가 없는 장소("동방 1호")는 그릴 지도가 없어 섹션째로 뺀다.
  const coordinates =
    isKakaoMapsAvailable && place.latitude !== null && place.longitude !== null
      ? { latitude: place.latitude, longitude: place.longitude }
      : null;

  return (
    // 블록 간격 24는 라이브러리 화면의 섹션 간격(gap-6)과 맞춘 값이다.
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 pt-4">
        {place.imageUrl && (
          <img
            src={place.imageUrl}
            alt=""
            className="size-20 shrink-0 rounded-md border border-grey-50 object-cover opacity-80"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="typo-xl-sb break-words text-grey-50">{place.name}</h2>
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
  );
};

import { useRef } from 'react';
import { StaticMap } from 'react-kakao-maps-sdk';
import { useKakaoMapLoader } from '@/shared/lib/use-kakao-map-loader';
import { getPlaceMapUrl } from '../lib/place-map-url';

interface PlaceStaticMapProps {
  name: string;
  latitude: number;
  longitude: number;
}

// 건물 단위가 보이는 배율. 숫자가 작을수록 확대된다.
const MAP_LEVEL = 3;

const BOX_CLASS = 'aspect-square w-full overflow-hidden rounded-md bg-surface-3';

/**
 * 장소 위치를 보여주는 정적 지도(이미지). 누르면 카카오맵이 새 탭으로 열린다.
 * 움직이는 지도를 쓰지 않는 이유: 세로로 스크롤하는 화면 안에서는 손가락이
 * 지도에 걸릴 때마다 페이지 스크롤이 멈춘다.
 * 키가 있을 때만 마운트한다(PlaceDetailView에서 판단).
 */
export const PlaceStaticMap = ({
  name,
  latitude,
  longitude,
}: PlaceStaticMapProps) => {
  const [isLoading, error] = useKakaoMapLoader();
  const wrapperRef = useRef<HTMLDivElement>(null);

  if (error) {
    return (
      <p
        className={`${BOX_CLASS} flex items-center justify-center typo-sm-r text-grey-300`}
      >
        지도를 불러오지 못했어요.
      </p>
    );
  }

  if (isLoading) {
    return <div className={BOX_CLASS} aria-hidden="true" />;
  }

  const position = { lat: latitude, lng: longitude };

  // SDK가 만든 링크에는 이름이 없어 스크린리더가 "링크"로만 읽는다.
  // 목적지도 좌표만 담긴 지도라, 장소명이 붙는 링크로 바꿔 둔다.
  const patchLink = () => {
    const container = wrapperRef.current;
    if (!container) return;
    const link = container.querySelector('a');
    link?.setAttribute('aria-label', `${name} 카카오맵에서 열기`);
    link?.setAttribute('rel', 'noopener noreferrer');
    const mapUrl = getPlaceMapUrl({ name, latitude, longitude });
    if (mapUrl) link?.setAttribute('href', mapUrl);
    container.querySelector('img')?.setAttribute('alt', '');
  };

  return (
    // SDK는 생성 시점의 컨테이너 크기를 img에 px로 박는다. 화면 폭이 바뀌어도
    // 넘치거나 비지 않게 img를 컨테이너에 맞춘다(인라인 스타일이라 !가 필요하다).
    <div
      ref={wrapperRef}
      className={`${BOX_CLASS} [&_a]:block [&_a]:size-full [&_img]:size-full! [&_img]:object-cover`}
    >
      <StaticMap
        // 좌표가 바뀌면 SDK 인스턴스를 새로 그려 링크 패치도 다시 적용한다.
        key={`${latitude},${longitude},${name}`}
        center={position}
        level={MAP_LEVEL}
        marker={{ position }}
        className="size-full"
        onCreate={patchLink}
      />
    </div>
  );
};

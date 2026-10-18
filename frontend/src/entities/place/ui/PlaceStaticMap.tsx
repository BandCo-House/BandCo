import { useEffect, useRef, useState } from 'react';
import { loadKakaoMaps } from '@/shared/lib/kakao-maps';
import { getPlaceMapUrl } from '../lib/place-map-url';

interface PlaceStaticMapProps {
  name: string;
  latitude: number;
  longitude: number;
}

// 건물 단위가 보이는 배율. 숫자가 작을수록 확대된다.
const MAP_LEVEL = 3;

/**
 * 장소 위치를 보여주는 정적 지도(이미지). 누르면 카카오맵이 새 탭으로 열린다.
 * 움직이는 지도를 쓰지 않는 이유: 세로로 스크롤하는 화면 안에서는 손가락이
 * 지도에 걸릴 때마다 페이지 스크롤이 멈춘다.
 */
export const PlaceStaticMap = ({
  name,
  latitude,
  longitude,
}: PlaceStaticMapProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    loadKakaoMaps()
      .then((maps) => {
        const container = containerRef.current;
        if (isCancelled || !container) return;

        container.replaceChildren();
        const position = new maps.LatLng(latitude, longitude);
        new maps.StaticMap(container, {
          center: position,
          level: MAP_LEVEL,
          marker: { position },
        });

        // SDK가 만든 링크에는 이름이 없어 스크린리더가 "링크"로만 읽는다.
        // 목적지도 좌표만 담긴 지도라, 장소명이 붙는 링크로 바꿔 둔다.
        const link = container.querySelector('a');
        link?.setAttribute('aria-label', `${name} 카카오맵에서 열기`);
        link?.setAttribute('rel', 'noopener noreferrer');
        const mapUrl = getPlaceMapUrl({ name, latitude, longitude });
        if (mapUrl) link?.setAttribute('href', mapUrl);
        container.querySelector('img')?.setAttribute('alt', '');
      })
      .catch(() => {
        if (!isCancelled) setIsError(true);
      });

    return () => {
      isCancelled = true;
    };
  }, [name, latitude, longitude]);

  if (isError) {
    return (
      <p className="flex aspect-square w-full items-center justify-center rounded-md bg-surface-3 typo-sm-r text-grey-300">
        지도를 불러오지 못했어요.
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      // SDK는 생성 시점의 컨테이너 크기를 img에 px로 박는다. 화면 폭이 바뀌어도
      // 넘치거나 비지 않게 img를 컨테이너에 맞춘다(인라인 스타일이라 !가 필요하다).
      className="aspect-square w-full overflow-hidden rounded-md bg-surface-3 [&_a]:block [&_a]:size-full [&_img]:size-full! [&_img]:object-cover"
    />
  );
};

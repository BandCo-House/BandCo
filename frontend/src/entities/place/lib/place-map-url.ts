import type { Place } from '../model/types';

/**
 * 장소를 카카오맵에서 여는 링크. 지도 검색으로 고른 장소(좌표 있음)만 만들 수 있다.
 * 주소 문자열로 검색 링크를 만들지 않는 이유: "동방 1호" 같은 자유 입력은
 * 지도에서 엉뚱한 곳이 나온다.
 */
export const getPlaceMapUrl = (
  place: Pick<Place, 'name' | 'latitude' | 'longitude'>,
): string | null => {
  if (place.latitude === null || place.longitude === null) return null;
  // 이름에 쉼표가 있으면 "이름,위도,경도" 구분이 깨진다.
  const label = encodeURIComponent(place.name.replaceAll(',', ' '));
  return `https://map.kakao.com/link/map/${label},${place.latitude},${place.longitude}`;
};

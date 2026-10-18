import { z } from 'zod';
import { loadKakaoMaps } from '@/shared/lib/kakao-maps';

// 카카오 로컬 키워드 검색 결과 중 쓰는 필드만 검증한다. 좌표는 문자열로 온다(x=경도, y=위도).
const kakaoPlaceSchema = z.object({
  id: z.string(),
  place_name: z.string(),
  address_name: z.string(),
  road_address_name: z.string(),
  x: z.coerce.number(),
  y: z.coerce.number(),
});

export interface PlaceSearchResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

/**
 * 상호명·주소 키워드로 장소를 검색한다(카카오맵 키워드 검색).
 * 도로명주소가 없는 곳은 지번주소로 대신한다.
 */
export const searchPlaces = async (
  keyword: string,
): Promise<PlaceSearchResult[]> => {
  const maps = await loadKakaoMaps();
  const { Places, Status } = maps.services;

  const data = await new Promise<unknown>((resolve, reject) => {
    new Places().keywordSearch(keyword, (result, status) => {
      if (status === Status.OK) resolve(result);
      else if (status === Status.ZERO_RESULT) resolve([]);
      else reject(new Error('장소 검색에 실패했습니다.'));
    });
  });

  return z
    .array(kakaoPlaceSchema)
    .parse(data)
    .map((place) => ({
      id: place.id,
      name: place.place_name,
      address: place.road_address_name || place.address_name,
      latitude: place.y,
      longitude: place.x,
    }));
};

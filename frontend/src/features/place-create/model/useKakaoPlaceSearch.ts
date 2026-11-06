import { useRef, useState } from 'react';

/** 주소 검색 결과 한 건. 카카오 응답을 화면에서 쓰는 모양으로 정규화한다. */
export interface PlaceSearchResult {
  id: string;
  name: string;
  /** 도로명 주소 우선, 없으면 지번 주소. */
  address: string;
  lat: number;
  lng: number;
}

export type PlaceSearchStatus =
  | 'idle'
  | 'loading'
  | 'success'
  | 'empty'
  | 'error';

export const toPlaceSearchResult = (
  item: kakao.maps.services.PlacesSearchResultItem,
): PlaceSearchResult => ({
  id: item.id,
  name: item.place_name,
  address: item.road_address_name || item.address_name,
  lat: Number(item.y),
  lng: Number(item.x),
});

/**
 * 카카오 장소 키워드 검색. SDK(`services` 라이브러리)가 로드된 뒤에만 `search`를 호출한다.
 * 응답이 늦게 도착해 최신 검색 결과를 덮어쓰지 않도록 요청 순번으로 거른다.
 */
export const useKakaoPlaceSearch = () => {
  const [results, setResults] = useState<PlaceSearchResult[]>([]);
  const [status, setStatus] = useState<PlaceSearchStatus>('idle');
  const requestIdRef = useRef(0);

  const reset = () => {
    requestIdRef.current += 1;
    setResults([]);
    setStatus('idle');
  };

  const search = (keyword: string) => {
    const trimmed = keyword.trim();
    if (!trimmed) {
      reset();
      return;
    }

    const requestId = ++requestIdRef.current;
    setStatus('loading');

    const places = new kakao.maps.services.Places();
    places.keywordSearch(trimmed, (data, searchStatus) => {
      if (requestId !== requestIdRef.current) return;

      if (searchStatus === kakao.maps.services.Status.OK) {
        setResults(data.map(toPlaceSearchResult));
        setStatus('success');
        return;
      }
      setResults([]);
      setStatus(
        searchStatus === kakao.maps.services.Status.ZERO_RESULT
          ? 'empty'
          : 'error',
      );
    });
  };

  return { results, status, search, reset };
};

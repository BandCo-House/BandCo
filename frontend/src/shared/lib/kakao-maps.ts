import { KAKAO_MAP_APP_KEY } from '@/shared/api/config';

interface KakaoPlacesService {
  keywordSearch: (
    keyword: string,
    callback: (data: unknown, status: string) => void,
  ) => void;
}

type KakaoLatLng = object;

export interface KakaoMaps {
  load: (callback: () => void) => void;
  LatLng: new (latitude: number, longitude: number) => KakaoLatLng;
  /** 컨테이너 안에 지도 이미지와 카카오맵으로 가는 링크를 그린다. 생성 시점의 컨테이너 크기로 고정된다. */
  StaticMap: new (
    container: HTMLElement,
    options: {
      center: KakaoLatLng;
      level: number;
      marker?: { position: KakaoLatLng };
    },
  ) => unknown;
  services: {
    Places: new () => KakaoPlacesService;
    Status: { OK: string; ZERO_RESULT: string; ERROR: string };
  };
}

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps };
  }
}

export const isKakaoMapsAvailable = KAKAO_MAP_APP_KEY.length > 0;

let sdkPromise: Promise<KakaoMaps> | null = null;

/**
 * 카카오맵 JS SDK(services 라이브러리 포함)를 처음 쓸 때 한 번만 불러온다.
 * index.html에 두지 않는 이유: 장소 검색을 여는 사람만 쓰는 스크립트라
 * 모든 화면의 첫 로드에 얹을 이유가 없다.
 */
export const loadKakaoMaps = (): Promise<KakaoMaps> => {
  sdkPromise ??= new Promise<KakaoMaps>((resolve, reject) => {
    const script = document.createElement('script');
    // autoload=false: 동적 삽입에서는 SDK가 document.write로 하위 스크립트를
    // 붙이지 못하므로, maps.load()로 준비 시점을 직접 받는다.
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_APP_KEY}&libraries=services&autoload=false`;
    script.async = true;
    script.onload = () => {
      const maps = window.kakao?.maps;
      if (!maps) {
        reject(new Error('카카오맵 SDK를 초기화하지 못했습니다.'));
        return;
      }
      maps.load(() => resolve(maps));
    };
    script.onerror = () => {
      // 실패한 promise를 들고 있으면 네트워크가 돌아와도 다시 시도할 수 없다.
      sdkPromise = null;
      script.remove();
      reject(new Error('카카오맵 SDK를 불러오지 못했습니다.'));
    };
    document.head.append(script);
  });

  return sdkPromise;
};

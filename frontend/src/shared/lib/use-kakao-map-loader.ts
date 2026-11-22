import { useKakaoLoader } from 'react-kakao-maps-sdk';
import { KAKAO_MAP_APP_KEY } from '@/shared/api/config';

/**
 * 카카오맵 SDK 로더. react-kakao-maps-sdk의 Loader는 싱글톤이라
 * 호출마다 옵션이 다르면 에러를 던지므로, 옵션을 이 한 곳에서만 정한다.
 * 키가 있을 때만 마운트되는 컴포넌트에서 호출한다.
 */
export const useKakaoMapLoader = () =>
  useKakaoLoader({
    appkey: KAKAO_MAP_APP_KEY,
    libraries: ['services'],
  });

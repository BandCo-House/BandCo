import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as kakaoMaps from '@/shared/lib/kakao-maps';
import type { KakaoMaps } from '@/shared/lib/kakao-maps';
import { searchPlaces } from './place-search-api';

const STATUS = { OK: 'OK', ZERO_RESULT: 'ZERO_RESULT', ERROR: 'ERROR' };

/** keywordSearch가 주어진 결과·상태로 응답하는 SDK를 흉내 낸다. */
const mockSdk = (data: unknown, status: string) => {
  const maps = {
    load: (callback: () => void) => callback(),
    services: {
      Places: class {
        keywordSearch(
          _keyword: string,
          callback: (data: unknown, status: string) => void,
        ) {
          callback(data, status);
        }
      },
      Status: STATUS,
    },
  } as unknown as KakaoMaps;
  vi.spyOn(kakaoMaps, 'loadKakaoMaps').mockResolvedValue(maps);
};

const kakaoPlace = {
  id: '1234',
  place_name: '합정 사운드룸',
  address_name: '서울 마포구 합정동 123-45',
  road_address_name: '서울 마포구 양화로 45',
  x: '126.9139',
  y: '37.5496',
};

describe('searchPlaces', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('카카오 결과를 이름·도로명주소·숫자 좌표로 변환한다', async () => {
    mockSdk([kakaoPlace], STATUS.OK);

    await expect(searchPlaces('합정')).resolves.toEqual([
      {
        id: '1234',
        name: '합정 사운드룸',
        address: '서울 마포구 양화로 45',
        latitude: 37.5496,
        longitude: 126.9139,
      },
    ]);
  });

  it('도로명주소가 없으면 지번주소를 쓴다', async () => {
    mockSdk([{ ...kakaoPlace, road_address_name: '' }], STATUS.OK);

    const [place] = await searchPlaces('합정');
    expect(place?.address).toBe('서울 마포구 합정동 123-45');
  });

  it('결과 없음은 빈 배열로 돌려준다', async () => {
    mockSdk([], STATUS.ZERO_RESULT);

    await expect(searchPlaces('없는곳')).resolves.toEqual([]);
  });

  it('검색 오류는 reject한다', async () => {
    // 키의 도메인 미등록 등. 빈 배열로 삼키면 "결과 없음"으로 보여 원인을 못 찾는다.
    mockSdk(null, STATUS.ERROR);

    await expect(searchPlaces('합정')).rejects.toThrow();
  });
});

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  toPlaceSearchResult,
  useKakaoPlaceSearch,
} from './useKakaoPlaceSearch';

type SearchCallback = (
  data: Partial<kakao.maps.services.PlacesSearchResultItem>[],
  status: string,
) => void;

const Status = { OK: 'OK', ZERO_RESULT: 'ZERO_RESULT', ERROR: 'ERROR' };
let pending: SearchCallback[] = [];
const keywordSearch = vi.fn((_keyword: string, callback: SearchCallback) => {
  pending.push(callback);
});

const item = {
  id: '1',
  place_name: '합주실 A',
  road_address_name: '서울 마포구 신촌로 12다길 20',
  address_name: '서울 마포구 노고산동 1-1',
  x: '126.93',
  y: '37.55',
};

describe('useKakaoPlaceSearch', () => {
  beforeEach(() => {
    pending = [];
    keywordSearch.mockClear();
    vi.stubGlobal('kakao', {
      maps: {
        services: {
          Places: vi.fn(function Places() {
            return { keywordSearch };
          }),
          Status,
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('도로명 주소가 없으면 지번 주소로 정규화한다', () => {
    expect(
      toPlaceSearchResult({
        ...item,
        road_address_name: '',
      } as kakao.maps.services.PlacesSearchResultItem),
    ).toEqual({
      id: '1',
      name: '합주실 A',
      address: '서울 마포구 노고산동 1-1',
      lat: 37.55,
      lng: 126.93,
    });
  });

  it('검색 성공 시 결과를 정규화해 success 상태가 된다', () => {
    const { result } = renderHook(() => useKakaoPlaceSearch());

    act(() => result.current.search(' 합주실 '));
    expect(keywordSearch).toHaveBeenCalledWith('합주실', expect.any(Function));
    expect(result.current.status).toBe('loading');

    act(() => pending[0]([item], Status.OK));
    expect(result.current.status).toBe('success');
    expect(result.current.results[0].address).toBe(
      '서울 마포구 신촌로 12다길 20',
    );
  });

  it('결과가 없으면 empty, 실패하면 error 상태가 된다', () => {
    const { result } = renderHook(() => useKakaoPlaceSearch());

    act(() => result.current.search('없는곳'));
    act(() => pending[0]([], Status.ZERO_RESULT));
    expect(result.current.status).toBe('empty');

    act(() => result.current.search('에러'));
    act(() => pending[1]([], Status.ERROR));
    expect(result.current.status).toBe('error');
  });

  it('늦게 도착한 이전 검색 응답은 무시한다', () => {
    const { result } = renderHook(() => useKakaoPlaceSearch());

    act(() => result.current.search('첫번째'));
    act(() => result.current.search('두번째'));
    act(() => pending[1]([item], Status.OK));
    act(() => pending[0]([], Status.ZERO_RESULT));

    expect(result.current.status).toBe('success');
    expect(result.current.results).toHaveLength(1);
  });

  it('빈 검색어는 요청하지 않고 idle로 되돌린다', () => {
    const { result } = renderHook(() => useKakaoPlaceSearch());

    act(() => result.current.search('   '));
    expect(keywordSearch).not.toHaveBeenCalled();
    expect(result.current.status).toBe('idle');
  });
});

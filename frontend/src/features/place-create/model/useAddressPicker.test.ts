import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAddressPicker } from './useAddressPicker';

const mocks = vi.hoisted(() => ({
  currentLocation: { lat: 37.56, lng: 126.97 } as { lat: number; lng: number } | null,
  coordToAddress: vi.fn((lat: number, lng: number) =>
    Promise.resolve(`변환 주소 (${lat}, ${lng})`),
  ),
}));

vi.mock('./place-coords', () => ({
  getCurrentLocation: () => Promise.resolve(mocks.currentLocation),
  coordToAddress: (lat: number, lng: number) => mocks.coordToAddress(lat, lng),
}));

describe('useAddressPicker', () => {
  beforeEach(() => {
    mocks.currentLocation = { lat: 37.56, lng: 126.97 };
    mocks.coordToAddress.mockClear();
  });

  it('초기 상태에서는 마커가 없고 기본 위치를 가져온다', async () => {
    let hookResult!: { current: ReturnType<typeof useAddressPicker> };
    await act(async () => {
      hookResult = renderHook(() => useAddressPicker()).result;
    });

    expect(hookResult.current.markerPosition).toBeNull();
    expect(hookResult.current.selectedResultId).toBeNull();
    expect(hookResult.current.selectedPlaceInfo).toBeNull();
    expect(hookResult.current.mapCenter).toEqual({ lat: 37.56, lng: 126.97 });
    expect(hookResult.current.isInitializingLocation).toBe(false);
  });

  it('selectResult 호출 시 마커와 지도 중심 및 선택 정보가 설정된다', async () => {
    let hookResult!: { current: ReturnType<typeof useAddressPicker> };
    await act(async () => {
      hookResult = renderHook(() => useAddressPicker()).result;
    });

    act(() => {
      hookResult.current.selectResult({
        id: 'place-1',
        name: '연습실',
        address: '서울 마포구',
        lat: 37.55,
        lng: 126.93,
      });
    });

    expect(hookResult.current.selectedResultId).toBe('place-1');
    expect(hookResult.current.markerPosition).toEqual({ lat: 37.55, lng: 126.93 });
    expect(hookResult.current.mapCenter).toEqual({ lat: 37.55, lng: 126.93 });
    expect(hookResult.current.selectedPlaceInfo).toEqual({
      name: '연습실',
      address: '서울 마포구',
    });
    expect(hookResult.current.canConfirm).toBe(true);
  });

  it('movePin 호출 시 검색 결과 선택이 해제되고 역지오코딩된 주소로 갱신된다', async () => {
    const { result } = renderHook(() => useAddressPicker());

    // 먼저 검색 결과 선택
    act(() => {
      result.current.selectResult({
        id: 'place-1',
        name: '연습실',
        address: '서울 마포구',
        lat: 37.55,
        lng: 126.93,
      });
    });

    // 핀 이동
    await act(async () => {
      await result.current.movePin(37.58, 126.99);
    });

    expect(result.current.selectedResultId).toBeNull();
    expect(result.current.markerPosition).toEqual({ lat: 37.58, lng: 126.99 });
    expect(result.current.selectedPlaceInfo).toEqual({
      name: '선택한 위치',
      address: '변환 주소 (37.58, 126.99)',
    });
    expect(result.current.canConfirm).toBe(true);
  });
});

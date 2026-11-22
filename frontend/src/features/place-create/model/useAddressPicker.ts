import { useEffect, useRef, useState } from 'react';
import type { PlaceSearchResult } from './useKakaoPlaceSearch';
import { coordToAddress, getCurrentLocation } from './place-coords';

export const DEFAULT_MAP_CENTER = { lat: 37.5665, lng: 126.978 };
const UNKNOWN_ADDRESS = '주소를 확인할 수 없는 위치';

export interface SelectedPlaceInfo {
  name: string;
  address: string;
}

export interface InitialLocation {
  lat: number;
  lng: number;
  address?: string;
  name?: string;
}

interface UseAddressPickerOptions {
  initialLocation?: InitialLocation | null;
}

/**
 * 주소 검색 모달에서 지도 중심, 핀 위치, 검색 결과 선택 및 역지오코딩을 관리하는 훅.
 */
export const useAddressPicker = (options: UseAddressPickerOptions = {}) => {
  const { initialLocation } = options;

  const [mapCenter, setMapCenter] = useState(() =>
    initialLocation
      ? { lat: initialLocation.lat, lng: initialLocation.lng }
      : DEFAULT_MAP_CENTER,
  );
  const [markerPosition, setMarkerPosition] = useState<{
    lat: number;
    lng: number;
  } | null>(() =>
    initialLocation
      ? { lat: initialLocation.lat, lng: initialLocation.lng }
      : null,
  );
  const [selectedResultId, setSelectedResultId] = useState<string | null>(null);
  const [selectedPlaceInfo, setSelectedPlaceInfo] =
    useState<SelectedPlaceInfo | null>(() =>
      initialLocation && initialLocation.address
        ? {
            name: initialLocation.name || '선택한 위치',
            address: initialLocation.address,
          }
        : null,
    );
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isInitializingLocation, setIsInitializingLocation] = useState(
    !initialLocation,
  );
  const resolveSeqRef = useRef(0);

  // 초기 위치가 없을 때만 사용자 현재 위치를 확인하여 중심 설정
  useEffect(() => {
    if (initialLocation) return;

    let isMounted = true;
    void getCurrentLocation().then((loc) => {
      if (!isMounted) return;
      if (loc) {
        setMapCenter({ ...loc });
      }
      setIsInitializingLocation(false);
    });
    return () => {
      isMounted = false;
    };
  }, [initialLocation]);

  const selectResult = (place: PlaceSearchResult) => {
    resolveSeqRef.current += 1;
    setIsResolvingAddress(false);
    setSelectedResultId(place.id);
    setMarkerPosition({ lat: place.lat, lng: place.lng });
    setMapCenter({ lat: place.lat, lng: place.lng });
    setSelectedPlaceInfo({ name: place.name, address: place.address });
  };

  const movePin = async (lat: number, lng: number) => {
    const requestSeq = ++resolveSeqRef.current;
    // 핀을 드래그하거나 화면을 터치해 옮기면 검색 목록 포커스를 해제한다
    setSelectedResultId(null);
    setMarkerPosition({ lat, lng });
    setIsResolvingAddress(true);
    try {
      const address = await coordToAddress(lat, lng);
      if (requestSeq !== resolveSeqRef.current) return;
      setSelectedPlaceInfo({
        name: '선택한 위치',
        address: address || UNKNOWN_ADDRESS,
      });
    } finally {
      if (requestSeq === resolveSeqRef.current) {
        setIsResolvingAddress(false);
      }
    }
  };

  const canConfirm = Boolean(
    selectedPlaceInfo &&
      selectedPlaceInfo.address &&
      selectedPlaceInfo.address !== UNKNOWN_ADDRESS &&
      !isResolvingAddress,
  );

  return {
    mapCenter,
    markerPosition,
    selectedResultId,
    selectedPlaceInfo,
    isResolvingAddress,
    isInitializingLocation,
    canConfirm,
    selectResult,
    movePin,
  };
};

/**
 * 브라우저의 Geolocation API를 통해 사용자의 현재 위치 좌표를 가져온다.
 * 지원하지 않거나 권한이 거부된 경우 null을 반환한다.
 */
export const getCurrentLocation = (): Promise<{ lat: number; lng: number } | null> => {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // HighAccuracy 실패 시 일반 모드로 재시도 (PC 크롬/엣지에서 흔한 타임아웃 방지)
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          () => {
            resolve(null);
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 },
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 },
    );
  });
};

/**
 * 카카오 SDK Geocoder를 사용하여 좌표(lat, lng)를 도로명 또는 지번 주소 문자열로 변환한다.
 * 도로명 주소가 있으면 우선 반환하고, 없으면 지번 주소를 반환한다.
 */
export const coordToAddress = (lat: number, lng: number): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.kakao?.maps?.services?.Geocoder) {
      resolve('');
      return;
    }

    try {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.coord2Address(lng, lat, (result, status) => {
        if (
          status === window.kakao.maps.services.Status.OK &&
          result &&
          result[0]
        ) {
          const road = result[0].road_address?.address_name;
          const jibun = result[0].address?.address_name;
          resolve(road || jibun || '');
        } else {
          resolve('');
        }
      });
    } catch {
      resolve('');
    }
  });
};

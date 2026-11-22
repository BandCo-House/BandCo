import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { coordToAddress, getCurrentLocation } from './place-coords';

describe('place-coords', () => {
  describe('getCurrentLocation', () => {
    const originalGeolocation = navigator.geolocation;

    afterEach(() => {
      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeolocation,
        configurable: true,
      });
    });

    it('위치 정보를 성공적으로 가져오면 lat, lng을 반환한다', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((success) => {
          success({
            coords: {
              latitude: 37.5123,
              longitude: 127.0456,
            },
          });
        }),
      };
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true,
      });

      const location = await getCurrentLocation();
      expect(location).toEqual({ lat: 37.5123, lng: 127.0456 });
    });

    it('위치 정보 조회가 실패하거나 거부되면 null을 반환한다', async () => {
      const mockGeolocation = {
        getCurrentPosition: vi.fn((_success, error) => {
          error(new Error('Permission denied'));
        }),
      };
      Object.defineProperty(navigator, 'geolocation', {
        value: mockGeolocation,
        configurable: true,
      });

      const location = await getCurrentLocation();
      expect(location).toBeNull();
    });
  });

  describe('coordToAddress', () => {
    beforeEach(() => {
      class GeocoderMock {
        coord2Address(
          lng: number,
          lat: number,
          callback: (result: unknown[], status: string) => void,
        ) {
          if (lat === 37.55 && lng === 126.93) {
            callback(
              [
                {
                  road_address: { address_name: '서울 마포구 신촌로 123' },
                  address: { address_name: '서울 마포구 노고산동 1-1' },
                },
              ],
              'OK',
            );
          } else if (lat === 37.11 && lng === 127.11) {
            callback(
              [
                {
                  road_address: null,
                  address: { address_name: '경기 지번주소 99' },
                },
              ],
              'OK',
            );
          } else {
            callback([], 'ZERO_RESULT');
          }
        }
      }

      vi.stubGlobal('kakao', {
        maps: {
          services: {
            Status: { OK: 'OK' },
            Geocoder: GeocoderMock,
          },
        },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('도로명 주소가 있으면 도로명 주소를 반환한다', async () => {
      const address = await coordToAddress(37.55, 126.93);
      expect(address).toBe('서울 마포구 신촌로 123');
    });

    it('도로명 주소가 없고 지번 주소만 있으면 지번 주소를 반환한다', async () => {
      const address = await coordToAddress(37.11, 127.11);
      expect(address).toBe('경기 지번주소 99');
    });

    it('주소를 찾을 수 없으면 빈 문자열을 반환한다', async () => {
      const address = await coordToAddress(0, 0);
      expect(address).toBe('');
    });
  });
});

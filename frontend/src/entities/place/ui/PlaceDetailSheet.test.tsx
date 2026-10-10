import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as kakaoMaps from '@/shared/lib/kakao-maps';
import type { KakaoMaps } from '@/shared/lib/kakao-maps';
import type { Place } from '../model/types';
import { PlaceDetailSheet } from './PlaceDetailSheet';

vi.mock('@/shared/lib/kakao-maps', () => ({
  isKakaoMapsAvailable: true,
  loadKakaoMaps: vi.fn(),
}));

const place: Place = {
  placeId: 'place-1',
  name: '연습실 A',
  address: '서울 마포구 양화로 45',
  detailAddress: '지하 1층',
  latitude: 37.5496,
  longitude: 126.9139,
  imageUrl: null,
  isActive: true,
};

/** 실제 SDK처럼 컨테이너에 이름 없는 링크와 이미지를 그려 넣는다. */
const mockSdk = () => {
  const maps = {
    LatLng: class {},
    StaticMap: class {
      constructor(container: HTMLElement) {
        container.innerHTML =
          '<a target="_blank" href="https://map.kakao.com?mapJson=x"><img src="map.png"></a>';
      }
    },
  } as unknown as KakaoMaps;
  vi.mocked(kakaoMaps.loadKakaoMaps).mockResolvedValue(maps);
};

describe('PlaceDetailSheet', () => {
  beforeEach(() => {
    vi.mocked(kakaoMaps.loadKakaoMaps).mockReset();
  });

  it('이름과 위치를 보여주고, 지도는 장소명이 붙은 카카오맵 링크가 된다', async () => {
    mockSdk();
    render(
      <PlaceDetailSheet
        open
        place={place}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: '연습실 A' }),
    ).toBeInTheDocument();
    // 주소와 상세 위치는 한 줄로 잇지 않고 따로 보여준다.
    expect(screen.getByText('서울 마포구 양화로 45')).toBeInTheDocument();
    expect(screen.getByText('지하 1층')).toBeInTheDocument();
    expect(
      await screen.findByRole('link', { name: '연습실 A 카카오맵에서 열기' }),
    ).toHaveAttribute(
      'href',
      `https://map.kakao.com/link/map/${encodeURIComponent('연습실 A')},37.5496,126.9139`,
    );
  });

  it('좌표가 없는 장소는 위치 섹션을 보여주지 않는다', () => {
    render(
      <PlaceDetailSheet
        open
        place={{ ...place, latitude: null, longitude: null }}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole('heading', { name: '위치' }),
    ).not.toBeInTheDocument();
    expect(kakaoMaps.loadKakaoMaps).not.toHaveBeenCalled();
  });

  it('지도를 못 불러오면 빈 칸 대신 안내 문구를 보여준다', async () => {
    vi.mocked(kakaoMaps.loadKakaoMaps).mockRejectedValue(new Error('blocked'));
    render(
      <PlaceDetailSheet
        open
        place={place}
        onClose={vi.fn()}
        onEdit={vi.fn()}
      />,
    );

    expect(
      await screen.findByText('지도를 불러오지 못했어요.'),
    ).toBeInTheDocument();
  });

  it('확인을 누르면 닫는다', () => {
    mockSdk();
    const onClose = vi.fn();
    render(
      <PlaceDetailSheet
        open
        place={place}
        onClose={onClose}
        onEdit={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '확인' }));

    expect(onClose).toHaveBeenCalled();
  });

  it('수정을 누르면 수정 화면으로 넘긴다', () => {
    mockSdk();
    const onEdit = vi.fn();
    render(
      <PlaceDetailSheet open place={place} onClose={vi.fn()} onEdit={onEdit} />,
    );

    fireEvent.click(screen.getByRole('button', { name: '수정' }));

    expect(onEdit).toHaveBeenCalled();
  });
});

import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Place } from '../model/types';
import { PlaceDetailView } from './PlaceDetailView';

const mocks = vi.hoisted(() => ({
  loader: [false, undefined] as [boolean, ErrorEvent | undefined],
  staticMapRendered: vi.fn(),
}));

vi.mock('@/shared/api/config', () => ({ KAKAO_MAP_APP_KEY: 'test-key' }));

vi.mock('@/shared/lib/use-kakao-map-loader', () => ({
  useKakaoMapLoader: () => mocks.loader,
}));

// 실제 SDK처럼 컨테이너에 이름 없는 링크와 이미지를 그린 뒤 onCreate를 부른다.
vi.mock('react-kakao-maps-sdk', () => ({
  StaticMap: ({ onCreate }: { onCreate?: () => void }) => {
    mocks.staticMapRendered();
    useEffect(() => {
      onCreate?.();
    }, [onCreate]);
    return (
      <a target="_blank" href="https://map.kakao.com?mapJson=x">
        <img src="map.png" />
      </a>
    );
  },
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

describe('PlaceDetailView', () => {
  beforeEach(() => {
    mocks.loader = [false, undefined];
    mocks.staticMapRendered.mockClear();
  });

  it('이름과 위치를 보여주고, 지도는 장소명이 붙은 카카오맵 링크가 된다', async () => {
    render(<PlaceDetailView place={place} />);

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
      <PlaceDetailView place={{ ...place, latitude: null, longitude: null }} />,
    );

    expect(
      screen.queryByRole('heading', { name: '위치' }),
    ).not.toBeInTheDocument();
    expect(mocks.staticMapRendered).not.toHaveBeenCalled();
  });

  it('지도를 못 불러오면 빈 칸 대신 안내 문구를 보여준다', () => {
    mocks.loader = [false, new ErrorEvent('error')];
    render(<PlaceDetailView place={place} />);

    expect(screen.getByText('지도를 불러오지 못했어요.')).toBeInTheDocument();
  });
});

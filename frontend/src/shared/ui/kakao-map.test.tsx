import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KakaoMap } from './kakao-map';

const mocks = vi.hoisted(() => ({
  mapLevel: 3,
  setLevel: vi.fn(),
}));

vi.mock('react-kakao-maps-sdk', () => ({
  Map: ({
    children,
    onClick,
    onCreate,
  }: {
    children: ReactNode;
    onClick?: (map: unknown, e: { latLng: { getLat: () => number; getLng: () => number } }) => void;
    onCreate?: (map: { getLevel: () => number; setLevel: (level: number) => void }) => void;
  }) => {
    useEffect(() => {
      onCreate?.({
        getLevel: () => mocks.mapLevel,
        setLevel: mocks.setLevel,
      });
    }, [onCreate]);

    return (
      <div
        data-testid="kakao-map"
        onClick={() =>
          onClick?.(null as never, {
            latLng: {
              getLat: () => 37.551,
              getLng: () => 126.931,
            },
          })
        }
      >
        {children}
      </div>
    );
  },
  MapMarker: ({
    onDragEnd,
  }: {
    onDragEnd?: (marker: { getPosition: () => { getLat: () => number; getLng: () => number } }) => void;
  }) => (
    <div
      data-testid="kakao-marker"
      onClick={(event) => {
        event.stopPropagation();
        onDragEnd?.({
          getPosition: () => ({
            getLat: () => 37.552,
            getLng: () => 126.932,
          }),
        });
      }}
    />
  ),
}));

describe('KakaoMap', () => {
  beforeEach(() => {
    mocks.mapLevel = 3;
    mocks.setLevel.mockClear();
  });

  it('기본 지도와 확대/축소 버튼을 렌더링한다', () => {
    render(<KakaoMap center={{ lat: 37.55, lng: 126.93 }} />);

    expect(screen.getByTestId('kakao-map')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '지도 확대' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '지도 축소' })).toBeInTheDocument();
    expect(screen.queryByTestId('kakao-marker')).not.toBeInTheDocument();
  });

  it('마커 정보를 전달하면 마커가 렌더링된다', () => {
    render(
      <KakaoMap
        center={{ lat: 37.55, lng: 126.93 }}
        marker={{ position: { lat: 37.55, lng: 126.93 } }}
      />,
    );

    expect(screen.getByTestId('kakao-marker')).toBeInTheDocument();
  });

  it('지도 클릭 시 onMapClick 콜백으로 좌표를 전달한다', async () => {
    const user = userEvent.setup();
    const onMapClick = vi.fn();
    render(
      <KakaoMap
        center={{ lat: 37.55, lng: 126.93 }}
        onMapClick={onMapClick}
      />,
    );

    await user.click(screen.getByTestId('kakao-map'));
    expect(onMapClick).toHaveBeenCalledWith({ lat: 37.551, lng: 126.931 });
  });

  it('마커 드래그 시 onDragEnd 콜백으로 새 좌표를 전달한다', async () => {
    const user = userEvent.setup();
    const onDragEnd = vi.fn();
    render(
      <KakaoMap
        center={{ lat: 37.55, lng: 126.93 }}
        marker={{
          position: { lat: 37.55, lng: 126.93 },
          draggable: true,
          onDragEnd,
        }}
      />,
    );

    await user.click(screen.getByTestId('kakao-marker'));
    expect(onDragEnd).toHaveBeenCalledWith({ lat: 37.552, lng: 126.932 });
  });

  it('확대 및 축소 버튼을 누르면 setLevel이 호출된다', async () => {
    const user = userEvent.setup();
    render(<KakaoMap center={{ lat: 37.55, lng: 126.93 }} />);

    await user.click(screen.getByRole('button', { name: '지도 확대' }));
    expect(mocks.setLevel).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole('button', { name: '지도 축소' }));
    expect(mocks.setLevel).toHaveBeenCalledWith(4);
  });

  it('showZoomControl이 false이면 확대/축소 버튼을 숨긴다', () => {
    render(
      <KakaoMap
        center={{ lat: 37.55, lng: 126.93 }}
        showZoomControl={false}
      />,
    );

    expect(screen.queryByRole('button', { name: '지도 확대' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '지도 축소' })).not.toBeInTheDocument();
  });

  it('children을 지도 내부에 렌더링한다', () => {
    render(
      <KakaoMap center={{ lat: 37.55, lng: 126.93 }}>
        <div data-testid="custom-overlay">커스텀 오버레이</div>
      </KakaoMap>,
    );

    expect(screen.getByTestId('custom-overlay')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, type ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddressSearchModal } from './AddressSearchModal';

const mocks = vi.hoisted(() => ({
  appKey: 'test-key',
  search: vi.fn(),
  loader: [false, undefined] as [boolean, ErrorEvent | undefined],
  currentLocation: { lat: 37.56, lng: 126.97 },
  mapLevel: 3,
  setLevel: vi.fn(),
  coordToAddress: vi.fn((lat: number, lng: number) =>
    Promise.resolve(`변환된 주소 (${lat.toFixed(2)}, ${lng.toFixed(2)})`),
  ),
}));

vi.mock('@/shared/api/config', () => ({
  get KAKAO_MAP_APP_KEY() {
    return mocks.appKey;
  },
}));

vi.mock('../model/place-coords', () => ({
  getCurrentLocation: () => Promise.resolve(mocks.currentLocation),
  coordToAddress: (lat: number, lng: number) => mocks.coordToAddress(lat, lng),
}));

vi.mock('react-kakao-maps-sdk', () => ({
  useKakaoLoader: () => mocks.loader,
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

vi.mock('../model/useKakaoPlaceSearch', () => ({
  useKakaoPlaceSearch: () => ({
    status: 'success',
    results: [
      {
        id: 'p1',
        name: '합주실 A',
        address: '서울 마포구 신촌로 12다길 20',
        lat: 37.55,
        lng: 126.93,
      },
    ],
    search: mocks.search,
    reset: vi.fn(),
  }),
}));

describe('AddressSearchModal', () => {
  beforeEach(() => {
    mocks.appKey = 'test-key';
    mocks.loader = [false, undefined];
    mocks.search.mockClear();
    mocks.coordToAddress.mockClear();
  });

  it('시작 시에는 핀이 없고 안내 문구가 표시된다', async () => {
    render(
      <AddressSearchModal open onOpenChange={vi.fn()} onSelect={vi.fn()} />,
    );

    expect(
      await screen.findByText('장소를 검색하거나 지도에서 위치를 터치해 핀을 꽂아보세요.'),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('kakao-marker')).not.toBeInTheDocument();
  });

  it('검색어를 제출하면 키워드 검색을 요청한다', async () => {
    const user = userEvent.setup();
    render(
      <AddressSearchModal open onOpenChange={vi.fn()} onSelect={vi.fn()} />,
    );

    await user.type(
      screen.getByPlaceholderText('장소 이름이나 주소를 검색하세요'),
      '합주실{Enter}',
    );

    expect(mocks.search).toHaveBeenCalledWith('합주실');
  });

  it('결과를 고르고 상세주소를 입력해 확인하면 선택값을 돌려주고 닫힌다', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <AddressSearchModal
        open
        onOpenChange={onOpenChange}
        onSelect={onSelect}
      />,
    );

    const confirm = screen.getByRole('button', { name: '확인' });
    expect(confirm).toBeDisabled();

    await user.click(screen.getByRole('option', { name: /합주실 A/ }));
    expect(screen.getByTestId('kakao-map')).toBeInTheDocument();
    expect(screen.getByTestId('kakao-marker')).toBeInTheDocument();
    expect(screen.getByText('✓ 장소가 선택되었습니다')).toBeInTheDocument();

    await user.type(screen.getByLabelText('상세주소'), ' 201호 ');
    await user.click(confirm);

    expect(onSelect).toHaveBeenCalledWith({
      address: '서울 마포구 신촌로 12다길 20',
      detailAddress: '201호',
      latitude: 37.55,
      longitude: 126.93,
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('지도를 클릭(터치)하면 해당 좌표로 핀이 생기고 역지오코딩 주소가 표시된다', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <AddressSearchModal open onOpenChange={vi.fn()} onSelect={onSelect} />,
    );

    const map = await screen.findByTestId('kakao-map');
    await user.click(map);

    expect(await screen.findByText('선택한 위치')).toBeInTheDocument();
    expect(await screen.findByText('변환된 주소 (37.55, 126.93)')).toBeInTheDocument();
    expect(screen.getByTestId('kakao-marker')).toBeInTheDocument();

    const confirm = screen.getByRole('button', { name: '확인' });
    expect(confirm).not.toBeDisabled();
    await user.click(confirm);

    expect(onSelect).toHaveBeenCalledWith({
      address: '변환된 주소 (37.55, 126.93)',
      detailAddress: '',
      latitude: 37.551,
      longitude: 126.931,
    });
  });

  it('검색 결과를 선택한 상태에서 마커를 드래그하면 검색 목록 선택이 해제되고 새 주소로 갱신된다', async () => {
    const user = userEvent.setup();
    render(
      <AddressSearchModal open onOpenChange={vi.fn()} onSelect={vi.fn()} />,
    );

    // 1. 검색 결과 선택
    await user.click(screen.getByRole('option', { name: /합주실 A/ }));
    expect(screen.getByText('✓ 장소가 선택되었습니다')).toBeInTheDocument();

    // 2. 마커 드래그 시뮬레이션
    await user.click(screen.getByTestId('kakao-marker'));

    // 3. 검색 결과 선택 해제 확인
    expect(screen.queryByText('✓ 장소가 선택되었습니다')).not.toBeInTheDocument();
    expect(await screen.findByText('선택한 위치')).toBeInTheDocument();
    expect(await screen.findByText('변환된 주소 (37.55, 126.93)')).toBeInTheDocument();
  });

  it('확대 및 축소 버튼을 누르면 지도의 레벨을 변경한다', async () => {
    const user = userEvent.setup();
    render(
      <AddressSearchModal open onOpenChange={vi.fn()} onSelect={vi.fn()} />,
    );

    const zoomInBtn = await screen.findByRole('button', { name: '지도 확대' });
    const zoomOutBtn = screen.getByRole('button', { name: '지도 축소' });

    expect(zoomInBtn).toBeInTheDocument();
    expect(zoomOutBtn).toBeInTheDocument();

    await user.click(zoomInBtn);
    expect(mocks.setLevel).toHaveBeenCalledWith(2); // 3 - 1 = 2 (확대)

    await user.click(zoomOutBtn);
    expect(mocks.setLevel).toHaveBeenCalledWith(4); // 3 + 1 = 4 (축소)
  });

  it('카카오 키가 없으면 지도 대신 안내 문구를 보여준다', () => {
    mocks.appKey = '';
    render(
      <AddressSearchModal open onOpenChange={vi.fn()} onSelect={vi.fn()} />,
    );

    expect(screen.getByText(/지도를 불러오지 못했어요/)).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText('장소 이름이나 주소를 검색하세요'),
    ).not.toBeInTheDocument();
  });
});


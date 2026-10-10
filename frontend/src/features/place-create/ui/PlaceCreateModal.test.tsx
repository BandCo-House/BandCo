import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as placeApi from '@/entities/place/api/place-api';
import * as placeSearchApi from '@/entities/place/api/place-search-api';
import type { Place } from '@/entities/place/model/types';
import { PlaceCreateModal } from './PlaceCreateModal';

// 키가 없으면 위치 검색 진입점이 숨겨지므로, 테스트에서는 켜 둔다.
vi.mock('@/shared/lib/kakao-maps', () => ({
  isKakaoMapsAvailable: true,
  loadKakaoMaps: vi.fn(),
}));

const CREATED: Place = {
  placeId: 'place-new',
  name: '동방 1호',
  address: null,
  detailAddress: null,
  latitude: null,
  longitude: null,
  imageUrl: null,
  isActive: true,
};

const FOUND = {
  id: '1234',
  name: '합정 사운드룸',
  address: '서울 마포구 양화로 45',
  latitude: 37.5496,
  longitude: 126.9139,
};

const renderModal = (place?: Place) =>
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PlaceCreateModal
        open
        onOpenChange={vi.fn()}
        bandId="band-1"
        place={place}
      />
    </QueryClientProvider>,
  );

const SAVED: Place = {
  placeId: 'place-1',
  name: '합정 사운드룸',
  address: '서울 마포구 양화로 45',
  detailAddress: '지하 1층',
  latitude: 37.5496,
  longitude: 126.9139,
  imageUrl: 'https://example.com/cover.png',
  isActive: true,
};

const pickLocation = async () => {
  fireEvent.click(screen.getByRole('button', { name: '지도에서 찾기' }));
  fireEvent.change(
    screen.getByPlaceholderText('합주실 이름, 주소로 검색하세요'),
    { target: { value: '합정' } },
  );
  fireEvent.click(await screen.findByText('서울 마포구 양화로 45'));
};

describe('PlaceCreateModal', () => {
  let createPlace: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    createPlace = vi.spyOn(placeApi, 'createPlace').mockResolvedValue(CREATED);
    vi.spyOn(placeSearchApi, 'searchPlaces').mockResolvedValue([FOUND]);
  });

  it('이름만 입력해도 장소를 추가할 수 있다', async () => {
    renderModal();

    const submit = screen.getByRole('button', { name: '추가' });
    expect(submit).toBeDisabled();

    fireEvent.change(screen.getByLabelText('장소 이름'), {
      target: { value: '동방 1호' },
    });
    fireEvent.click(submit);

    await waitFor(() =>
      expect(createPlace).toHaveBeenCalledWith('band-1', {
        name: '동방 1호',
        address: undefined,
        latitude: undefined,
        longitude: undefined,
        detailAddress: undefined,
        imageUrl: undefined,
      }),
    );
  });

  it('지도에서 고른 위치의 주소·좌표와 상세 위치를 함께 보낸다', async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('장소 이름'), {
      target: { value: '우리 합주실' },
    });
    await pickLocation();
    fireEvent.change(screen.getByLabelText('상세 위치'), {
      target: { value: ' 지하 1층 B룸 ' },
    });
    fireEvent.click(screen.getByRole('button', { name: '추가' }));

    await waitFor(() =>
      expect(createPlace).toHaveBeenCalledWith('band-1', {
        // 이미 적은 이름은 상호명으로 덮지 않는다.
        name: '우리 합주실',
        address: '서울 마포구 양화로 45',
        latitude: 37.5496,
        longitude: 126.9139,
        detailAddress: '지하 1층 B룸',
        imageUrl: undefined,
      }),
    );
  });

  it('이름이 비어 있으면 고른 장소의 상호명으로 채운다', async () => {
    renderModal();

    await pickLocation();

    expect(screen.getByLabelText('장소 이름')).toHaveValue('합정 사운드룸');
  });

  it('위치를 지우면 주소·좌표를 보내지 않는다', async () => {
    renderModal();

    await pickLocation();
    fireEvent.click(screen.getByRole('button', { name: '위치 지우기' }));
    fireEvent.click(screen.getByRole('button', { name: '추가' }));

    await waitFor(() =>
      expect(createPlace).toHaveBeenCalledWith('band-1', {
        name: '합정 사운드룸',
      }),
    );
  });

  describe('수정', () => {
    let updatePlace: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      updatePlace = vi.spyOn(placeApi, 'updatePlace').mockResolvedValue(SAVED);
    });

    it('기존 값을 채워 열고, 손대지 않은 커버는 보내지 않는다', async () => {
      renderModal(SAVED);

      expect(screen.getByLabelText('장소 이름')).toHaveValue('합정 사운드룸');
      expect(screen.getByLabelText('상세 위치')).toHaveValue('지하 1층');
      expect(screen.getByText('서울 마포구 양화로 45')).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText('장소 이름'), {
        target: { value: '합정 사운드룸 B' },
      });
      fireEvent.click(screen.getByRole('button', { name: '수정' }));

      await waitFor(() =>
        expect(updatePlace).toHaveBeenCalledWith('place-1', {
          name: '합정 사운드룸 B',
          address: '서울 마포구 양화로 45',
          latitude: 37.5496,
          longitude: 126.9139,
          detailAddress: '지하 1층',
          imageUrl: undefined,
        }),
      );
      expect(createPlace).not.toHaveBeenCalled();
    });

    it('지운 위치·상세 위치·커버는 null로 보내 서버에서도 지운다', async () => {
      // PATCH는 안 보낸 필드를 유지하므로, undefined로 보내면 지운 줄 알았는데 그대로 남는다.
      renderModal(SAVED);

      fireEvent.click(screen.getByRole('button', { name: '위치 지우기' }));
      fireEvent.change(screen.getByLabelText('상세 위치'), {
        target: { value: '' },
      });
      fireEvent.click(screen.getByRole('button', { name: '커버 제거' }));
      fireEvent.click(screen.getByRole('button', { name: '수정' }));

      await waitFor(() =>
        expect(updatePlace).toHaveBeenCalledWith('place-1', {
          name: '합정 사운드룸',
          address: null,
          detailAddress: null,
          imageUrl: null,
        }),
      );
    });
  });
});

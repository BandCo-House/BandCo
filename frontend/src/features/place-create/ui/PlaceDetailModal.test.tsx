import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as placeApi from '@/entities/place/api/place-api';
import type { Place } from '@/entities/place/model/types';
import { PlaceDetailModal } from './PlaceDetailModal';

// 키가 없으면 위치 칸이 숨겨지므로 켜 둔다. 지도 로딩은 이 테스트의 관심사가 아니다.
vi.mock('@/shared/lib/kakao-maps', () => ({
  isKakaoMapsAvailable: true,
  loadKakaoMaps: vi.fn(() => new Promise(() => {})),
}));

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

const renderModal = ({ canDelete = true } = {}) => {
  const onOpenChange = vi.fn();
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <PlaceDetailModal
        open
        onOpenChange={onOpenChange}
        bandId="band-1"
        place={SAVED}
        canDelete={canDelete}
      />
    </QueryClientProvider>,
  );
  return { onOpenChange };
};

const startEdit = () =>
  fireEvent.click(screen.getByRole('button', { name: '수정' }));

describe('PlaceDetailModal', () => {
  let updatePlace: ReturnType<typeof vi.spyOn>;
  let deletePlace: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.restoreAllMocks();
    updatePlace = vi.spyOn(placeApi, 'updatePlace').mockResolvedValue(SAVED);
    deletePlace = vi.spyOn(placeApi, 'deletePlace').mockResolvedValue({});
  });

  it('수정을 누르면 같은 시트 안에서 폼으로 바뀌고, 뒤로 가면 상세로 돌아온다', () => {
    const { onOpenChange } = renderModal();
    expect(screen.getAllByRole('dialog')).toHaveLength(1);

    startEdit();

    // 시트가 한 겹 더 뜨지 않는다.
    expect(screen.getAllByRole('dialog')).toHaveLength(1);
    expect(screen.getByLabelText('장소 이름')).toHaveValue('합정 사운드룸');
    expect(screen.getByLabelText('상세 위치')).toHaveValue('지하 1층');

    fireEvent.click(screen.getByRole('button', { name: '뒤로 가기' }));

    expect(screen.getByRole('button', { name: '확인' })).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('저장하면 손대지 않은 커버는 보내지 않고 상세로 돌아온다', async () => {
    renderModal();
    startEdit();

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
    expect(
      await screen.findByRole('button', { name: '확인' }),
    ).toBeInTheDocument();
  });

  it('지운 위치·상세 위치·커버는 null로 보내 서버에서도 지운다', async () => {
    // PATCH는 안 보낸 필드를 유지하므로, undefined로 보내면 지운 줄 알았는데 그대로 남는다.
    renderModal();
    startEdit();

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

  it('삭제는 확인을 거친 뒤에만 보내고, 끝나면 닫는다', async () => {
    const { onOpenChange } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: '장소 삭제' }));
    expect(deletePlace).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: '삭제' }));

    await waitFor(() => expect(deletePlace).toHaveBeenCalledWith('place-1'));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('권한이 없으면 삭제 액션을 보여주지 않는다', () => {
    renderModal({ canDelete: false });

    expect(
      screen.queryByRole('button', { name: '장소 삭제' }),
    ).not.toBeInTheDocument();
  });
});

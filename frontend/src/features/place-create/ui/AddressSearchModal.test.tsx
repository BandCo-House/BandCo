import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AddressSearchModal } from './AddressSearchModal';

const mocks = vi.hoisted(() => ({
  appKey: 'test-key',
  search: vi.fn(),
  loader: [false, undefined] as [boolean, ErrorEvent | undefined],
}));

vi.mock('@/shared/api/config', () => ({
  get KAKAO_MAP_APP_KEY() {
    return mocks.appKey;
  },
}));

vi.mock('react-kakao-maps-sdk', () => ({
  useKakaoLoader: () => mocks.loader,
  Map: ({ children }: { children: ReactNode }) => (
    <div data-testid="kakao-map">{children}</div>
  ),
  MapMarker: () => null,
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

    await user.type(screen.getByLabelText('상세주소'), ' 201호 ');
    await user.click(confirm);

    expect(onSelect).toHaveBeenCalledWith({
      address: '서울 마포구 신촌로 12다길 20',
      detailAddress: '201호',
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
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

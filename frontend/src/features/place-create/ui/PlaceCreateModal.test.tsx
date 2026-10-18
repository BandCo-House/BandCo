import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AddressSelection } from './AddressSearchModal';
import { PlaceCreateModal } from './PlaceCreateModal';

const mocks = vi.hoisted(() => ({ mutate: vi.fn() }));

vi.mock('@/entities/place/api/useCreatePlace', () => ({
  useCreatePlace: () => ({ mutate: mocks.mutate, isPending: false }),
}));

vi.mock('@/shared/api', () => ({ uploadFile: vi.fn() }));

// 카카오 SDK 없이 "모달에서 주소를 골랐다"는 계약만 흉내 낸다.
// 실제 Dialog처럼 body로 포털해야 Sheet의 aria-hidden·pointer-events 잠금을 벗어난다.
vi.mock('./AddressSearchModal', async () => {
  const { createPortal } = await import('react-dom');
  return {
    AddressSearchModal: ({
      open,
      onSelect,
      onOpenChange,
    }: {
      open: boolean;
      onSelect: (selection: AddressSelection) => void;
      onOpenChange: (open: boolean) => void;
    }) =>
      open
        ? createPortal(
            <button
              type="button"
              style={{ pointerEvents: 'auto' }}
              onClick={() => {
                onSelect({
                  address: '서울 마포구 신촌로 12다길 20',
                  detailAddress: '201호',
                  latitude: 37.5551,
                  longitude: 126.9368,
                });
                onOpenChange(false);
              }}
            >
              주소 고르기
            </button>,
            document.body,
          )
        : null,
  };
});

describe('PlaceCreateModal', () => {
  beforeEach(() => {
    mocks.mutate.mockClear();
  });

  it('주소 칸은 직접 입력할 수 없고 검색 버튼으로 모달을 연다', async () => {
    const user = userEvent.setup();
    render(<PlaceCreateModal open onOpenChange={vi.fn()} bandId="band-1" />);

    const addressInput = screen.getByLabelText(/주소/);
    expect(addressInput).toHaveAttribute('readonly');

    await user.click(screen.getByRole('button', { name: '검색' }));
    expect(
      screen.getByRole('button', { name: '주소 고르기' }),
    ).toBeInTheDocument();
  });

  it('검색 모달에서 고른 주소를 보여주고 상세주소·좌표와 함께 전송한다', async () => {
    const user = userEvent.setup();
    render(<PlaceCreateModal open onOpenChange={vi.fn()} bandId="band-1" />);

    await user.type(screen.getByLabelText(/장소 이름/), '연습실 A');
    await user.click(screen.getByRole('button', { name: '검색' }));
    await user.click(screen.getByRole('button', { name: '주소 고르기' }));

    expect(screen.getByLabelText(/주소/)).toHaveValue(
      '서울 마포구 신촌로 12다길 20 201호',
    );

    await user.click(screen.getByRole('button', { name: '추가' }));

    expect(mocks.mutate).toHaveBeenCalledWith(
      {
        name: '연습실 A',
        address: '서울 마포구 신촌로 12다길 20',
        latitude: 37.5551,
        longitude: 126.9368,
        detailAddress: '201호',
        imageUrl: undefined,
      },
      expect.any(Object),
    );
  });

  it('주소를 고르기 전에는 추가 버튼이 비활성화된다', async () => {
    const user = userEvent.setup();
    render(<PlaceCreateModal open onOpenChange={vi.fn()} bandId="band-1" />);

    await user.type(screen.getByLabelText(/장소 이름/), '연습실 A');

    expect(screen.getByRole('button', { name: '추가' })).toBeDisabled();
  });
});

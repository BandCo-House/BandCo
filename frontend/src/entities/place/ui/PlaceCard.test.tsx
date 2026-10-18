import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Place } from '../model/types';
import { PlaceCard } from './PlaceCard';

const place: Place = {
  placeId: 'place-1',
  bandId: 'band-1',
  name: '연습실 A',
  address: '서울특별시 신촌로 94',
  detailAddress: null,
  latitude: null,
  longitude: null,
  imageUrl: null,
  isActive: true,
};

describe('PlaceCard', () => {
  it('전달받은 장소의 이름과 주소를 화면에 표시한다', () => {
    render(<PlaceCard place={place} onClick={vi.fn()} />);
    expect(screen.getByText('연습실 A')).toBeInTheDocument();
    expect(screen.getByText('서울특별시 신촌로 94')).toBeInTheDocument();
  });

  it('주소가 없으면 상세 위치만 표시한다', () => {
    render(
      <PlaceCard
        place={{ ...place, address: null, detailAddress: '학생회관 3층' }}
        onClick={vi.fn()}
      />,
    );
    expect(screen.getByText('학생회관 3층')).toBeInTheDocument();
  });

  it('카드를 누르면 onClick을 부른다', () => {
    const onClick = vi.fn();
    render(<PlaceCard place={place} onClick={onClick} />);

    fireEvent.click(
      screen.getByRole('button', { name: '연습실 A, 서울특별시 신촌로 94' }),
    );

    expect(onClick).toHaveBeenCalled();
  });
});

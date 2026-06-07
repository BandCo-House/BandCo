import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Place } from '../model/types';
import { PlaceCard } from './PlaceCard';

const place: Place = {
  placeId: 'place-1',
  bandId: 'band-1',
  name: '연습실 A',
  address: '서울특별시 신촌로 94',
  detailAddress: null,
  imageUrl: null,
  isActive: true,
};

describe('PlaceCard', () => {
  it('장소명과 주소를 props에서 렌더링한다', () => {
    render(<PlaceCard place={place} />);
    expect(screen.getByText('연습실 A')).toBeInTheDocument();
    expect(screen.getByText('서울특별시 신촌로 94')).toBeInTheDocument();
  });
});

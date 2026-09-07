import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import { getBandPlaces } from './place-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

const listItem = {
  placeId: 'place-1',
  name: '연습실 A',
  address: '서울특별시 신촌로 94',
  detailAddress: '3층 301호',
  imageUrl: null,
  isActive: true,
  createdAt: '2026-05-01T00:00:00+09:00',
  updatedAt: '2026-05-01T00:00:00+09:00',
};

describe('band place api 어댑터', () => {
  it('밴드 연습 장소 목록을 백엔드 경로로 조회하고 items 배열로 언랩한다', async () => {
    mock.onGet('/bands/band-1/places').reply(200, {
      status: 'success',
      error: null,
      message: '요청 성공',
      data: {
        bandId: 'band-1',
        items: [listItem],
        meta: { count: 1, take: 20, cursor: null, next: null },
      },
    });

    const result = await getBandPlaces('band-1');

    expect(result).toHaveLength(1);
    expect(result[0]?.placeId).toBe('place-1');
    expect(result[0]?.name).toBe('연습실 A');
    expect(result[0]?.address).toBe('서울특별시 신촌로 94');
  });

  it('필수 필드(name)가 누락되면 reject된다', async () => {
    mock.onGet('/bands/band-1/places').reply(200, {
      status: 'success',
      error: null,
      message: '요청 성공',
      data: { items: [{ placeId: 'place-1', address: '주소만' }] },
    });

    await expect(getBandPlaces('band-1')).rejects.toThrow();
  });
});

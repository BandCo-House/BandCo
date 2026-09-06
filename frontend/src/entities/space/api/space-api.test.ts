import { afterEach, describe, expect, it } from 'vitest';
import MockAdapter from 'axios-mock-adapter';

import { apiClient } from '@/shared/api/client';
import {
  createSpace,
  getBandSpaces,
  getSpace,
  getSpaceDetail,
} from './space-api';

const mock = new MockAdapter(apiClient);

afterEach(() => {
  mock.reset();
});

const listItem = {
  spaceId: 'space-1',
  bandId: 'band-1',
  createdByBandMemberId: 'member-1',
  name: '봄꽃 축제',
  description: '봄꽃 축제 연주곡 연습',
  spaceType: 'PERFORMANCE',
  status: 'ACTIVE',
  startDate: '2026-06-01',
  endDate: '2026-06-09',
  memberCount: 4,
  songCount: 3,
  isMine: true,
  myMembership: { isMember: true, role: 'MEMBER' },
  createdAt: '2026-05-01T00:00:00+09:00',
  updatedAt: '2026-05-01T00:00:00+09:00',
};

describe('band space api 어댑터', () => {
  it('밴드 스페이스 목록을 백엔드 경로로 조회하고 items 배열로 언랩한다', async () => {
    mock
      .onGet('/bands/band-1/bandspaces', { params: { onlyMine: true } })
      .reply(200, {
        status: 'success',
        error: null,
        message: '요청 성공',
        data: {
          items: [listItem],
          pagination: { page: 1, size: 20, totalCount: 1, hasNext: false },
        },
      });

    const result = await getBandSpaces('band-1', { onlyMine: true });

    expect(result).toHaveLength(1);
    expect(result[0]?.spaceId).toBe('space-1');
    expect(result[0]?.isMine).toBe(true);
    expect(result[0]?.endDate).toBe('2026-06-09');
    expect(result[0]?.status).toBe('ACTIVE');
  });

  it('스페이스 상세를 bandspaces 경로로 조회하고 space를 반환한다', async () => {
    mock.onGet('/bandspaces/space-1').reply(200, {
      status: 'success',
      error: null,
      message: '요청 성공',
      data: {
        space: {
          spaceId: 'space-1',
          bandId: 'band-1',
          name: '봄꽃 축제',
          description: '봄꽃 축제 연주곡 연습',
          spaceType: 'PERFORMANCE',
          status: 'ACTIVE',
          startDate: '2026-06-01',
          endDate: '2026-06-09',
          createdAt: '2026-05-01T00:00:00+09:00',
          updatedAt: '2026-05-01T00:00:00+09:00',
        },
        members: [],
        songCount: 3,
        scheduleCount: 2,
      },
    });

    const result = await getSpace('space-1');

    expect(result.spaceId).toBe('space-1');
    expect(result.spaceType).toBe('PERFORMANCE');
  });

  it('상세 응답에서 멤버 수(members 길이)와 곡 수를 요약해 반환한다', async () => {
    mock.onGet('/bandspaces/space-1').reply(200, {
      status: 'success',
      error: null,
      message: '요청 성공',
      data: {
        space: {
          spaceId: 'space-1',
          bandId: 'band-1',
          name: '2026 하계 공연 무대',
          description: '여름 축제 공연 준비',
          spaceType: 'PERFORMANCE',
          status: 'ACTIVE',
          startDate: '2026-07-01',
          endDate: '2026-09-05',
        },
        members: [{ bandMemberId: 'm-1' }, { bandMemberId: 'm-2' }],
        songCount: 6,
        scheduleCount: 4,
      },
    });

    const result = await getSpaceDetail('space-1');

    expect(result.space.name).toBe('2026 하계 공연 무대');
    expect(result.memberCount).toBe(2);
    expect(result.songCount).toBe(6);
  });

  it('스페이스를 bandspaces 경로로 생성한다', async () => {
    mock.onPost('/bands/band-1/bandspaces').reply(201, {
      status: 'success',
      error: null,
      message: '요청 성공',
      data: { ...listItem, spaceId: 'space-created', name: '새 합주' },
    });

    const result = await createSpace('band-1', {
      name: '새 합주',
      spaceType: 'PRACTICE',
    });

    expect(result.spaceId).toBe('space-created');
    expect(result.name).toBe('새 합주');
  });
});

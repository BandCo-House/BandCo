import assert from 'node:assert/strict';

import test from 'node:test';

import { SpacesMockRepository } from './repositories/spaces.mock-repository';
import { SpacesService } from './spaces.service';

test('합주 공간 목록 조회 서비스는 밴드, 검색어, 페이지네이션 조건을 적용한다', () => {
  const repository = new SpacesMockRepository();
  const service = new SpacesService(repository);

  const result = service.getBandSpaces('band-001', {
    query: '공연',
    onlyMine: undefined,
    inProgressOnly: true,
    page: 1,
    size: 1,
    sort: 'createdAt,asc',
  });

  assert.equal(result.items.length, 1);
  assert.equal(result.items[0]?.spaceId, 'space-001');
  assert.equal(result.pagination.page, 1);
  assert.equal(result.pagination.size, 1);
  assert.equal(result.pagination.totalCount, 2);
  assert.equal(result.pagination.hasNext, true);
});

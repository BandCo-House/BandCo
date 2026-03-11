import assert from 'node:assert/strict';

import test from 'node:test';

import { SpacesMockRepository } from './repositories/spaces.mock-repository';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';

test('합주 공간 목록 조회 컨트롤러는 공통 성공 응답 형식을 반환한다', () => {
  const repository = new SpacesMockRepository();
  const service = new SpacesService(repository);
  const controller = new SpacesController(service);

  const response = controller.getBandSpaces('band-001', {
    query: '공연',
    page: '1',
    size: '10',
  });

  assert.equal(response.status, 'success');
  assert.equal(response.error, null);
  assert.equal(response.message, '합주 공간 목록 조회 성공');
  assert.equal(response.data.items.length, 2);
  assert.equal(response.data.pagination.totalCount, 2);
});

test('합주 공간 상세 조회 컨트롤러는 공통 성공 응답 형식을 반환한다', () => {
  const repository = new SpacesMockRepository();
  const service = new SpacesService(repository);
  const controller = new SpacesController(service);

  const response = controller.getSpaceDetail('space-001');

  assert.equal(response.status, 'success');
  assert.equal(response.error, null);
  assert.equal(response.message, '합주 공간 상세 조회 성공');
  assert.equal(response.data.space.spaceId, 'space-001');
  assert.equal(response.data.members.length, 2);
  assert.equal(response.data.songCount, 12);
  assert.equal(response.data.scheduleCount, 28);
});

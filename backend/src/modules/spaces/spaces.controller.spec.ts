import assert from 'node:assert/strict';

import test from 'node:test';

import type { SpacesRepository } from './repositories/spaces.repository';
import { SpacesController } from './spaces.controller';
import { SpacesService } from './spaces.service';

function createSpacesRepositoryStub(): SpacesRepository {
  return {
    async addSpaceMember(spaceId, input) {
      return {
        memberId: 'member-001',
        spaceId,
        userId: input.userId,
        role: input.role,
        status: 'ACTIVE',
        joinedAt: '2026-02-21T09:00:00.000Z',
      };
    },
    async createBandSpace(bandId, input) {
      return {
        spaceId: 'created-space-001',
        bandId,
        name: input.name,
        description: input.description,
        spaceType: input.spaceType,
        status: input.status,
        startDate: input.startDate,
        endDate: input.endDate,
        createdByUserId: 'user-001',
        createdAt: '2026-02-21T09:30:00.000Z',
      };
    },
    async findBandSpaces() {
      return {
        items: [
          {
            spaceId: 'space-001',
            bandId: 'band-001',
            createdByUserId: 'user-001',
            name: '2026 하계공연 준비',
            description: '여름 축제 공연 준비 팀',
            spaceType: 'STUDIO',
            status: 'ACTIVE',
            startDate: '2026-08-01',
            endDate: '2026-08-20',
            memberCount: 2,
            songCount: 3,
            isMine: true,
            myMembership: {
              isMember: true,
              role: 'LEADER',
            },
            createdAt: '2026-02-18T10:20:30.000Z',
            updatedAt: '2026-02-20T12:00:00.000Z',
          },
          {
            spaceId: 'space-002',
            bandId: 'band-001',
            createdByUserId: 'user-002',
            name: '봄 정기공연 어쿠스틱 세션',
            description: '어쿠스틱 편성 연습 공간',
            spaceType: 'PRACTICE_ROOM',
            status: 'ACTIVE',
            startDate: '2026-03-01',
            endDate: '2026-03-25',
            memberCount: 2,
            songCount: 1,
            isMine: false,
            myMembership: {
              isMember: true,
              role: 'MEMBER',
            },
            createdAt: '2026-02-25T08:00:00.000Z',
            updatedAt: '2026-02-28T09:30:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          size: 10,
          totalCount: 2,
          hasNext: false,
        },
      };
    },
    async findDetailBySpaceId() {
      return {
        space: {
          spaceId: 'space-001',
          bandId: 'band-001',
          name: '2026 하계공연 준비',
          description: '여름 축제 공연 준비 팀',
          spaceType: 'STUDIO',
          status: 'ACTIVE',
          startDate: '2026-08-01',
          endDate: '2026-08-20',
          createdAt: '2026-02-18T10:20:30.000Z',
          updatedAt: '2026-02-20T12:00:00.000Z',
        },
        members: [
          {
            userId: 'user-001',
            nickname: '김민준',
            role: 'LEADER',
            status: 'ACTIVE',
            joinedAt: '2026-02-18T10:21:00.000Z',
          },
          {
            userId: 'user-002',
            nickname: '이서연',
            role: 'MEMBER',
            status: 'ACTIVE',
            joinedAt: '2026-02-18T10:22:00.000Z',
          },
        ],
        songCount: 3,
        scheduleCount: 2,
      };
    },
  };
}

test('합주 공간 멤버 추가 컨트롤러는 공통 성공 응답 형식을 반환한다', async () => {
  const repository = createSpacesRepositoryStub();
  const service = new SpacesService(repository);
  const controller = new SpacesController(service);

  const response = await controller.addSpaceMember('space-001', {
    userId: '22222222-2222-2222-2222-222222222222',
    role: 'MEMBER',
  });

  assert.equal(response.status, 'success');
  assert.equal(response.error, null);
  assert.equal(response.message, '합주 공간 멤버 추가 성공');
  assert.equal(response.data.memberId, 'member-001');
  assert.equal(response.data.spaceId, 'space-001');
  assert.equal(response.data.userId, '22222222-2222-2222-2222-222222222222');
});

test('합주 공간 생성 컨트롤러는 공통 성공 응답 형식을 반환한다', async () => {
  const repository = createSpacesRepositoryStub();
  const service = new SpacesService(repository);
  const controller = new SpacesController(service);

  const response = await controller.createBandSpace('band-001', {
    name: '3월 정기 합주',
    description: '정기 합주 준비',
    spaceType: 'STUDIO',
    status: 'ACTIVE',
    startDate: '2026-03-01',
    endDate: '2026-03-20',
  });

  assert.equal(response.status, 'success');
  assert.equal(response.error, null);
  assert.equal(response.message, '합주 공간 생성 성공');
  assert.equal(response.data.spaceId, 'created-space-001');
  assert.equal(response.data.bandId, 'band-001');
});

test('합주 공간 목록 조회 컨트롤러는 공통 성공 응답 형식을 반환한다', async () => {
  const repository = createSpacesRepositoryStub();
  const service = new SpacesService(repository);
  const controller = new SpacesController(service);

  const response = await controller.getBandSpaces('band-001', {
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

test('합주 공간 상세 조회 컨트롤러는 공통 성공 응답 형식을 반환한다', async () => {
  const repository = createSpacesRepositoryStub();
  const service = new SpacesService(repository);
  const controller = new SpacesController(service);

  const response = await controller.getSpaceDetail('space-001');

  assert.equal(response.status, 'success');
  assert.equal(response.error, null);
  assert.equal(response.message, '합주 공간 상세 조회 성공');
  assert.equal(response.data.space.spaceId, 'space-001');
  assert.equal(response.data.members.length, 2);
  assert.equal(response.data.songCount, 3);
  assert.equal(response.data.scheduleCount, 2);
});

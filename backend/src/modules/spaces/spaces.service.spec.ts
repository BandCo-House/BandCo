import assert from 'node:assert/strict';

import { NotFoundException } from '@nestjs/common';
import test from 'node:test';

import type { SpacesRepository } from './repositories/spaces.repository';
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
        ],
        pagination: {
          page: 1,
          size: 1,
          totalCount: 1,
          hasNext: false,
        },
      };
    },
    async findDetailBySpaceId(spaceId: string) {
      if (spaceId !== 'space-001') {
        return undefined;
      }

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

test('합주 공간 멤버 추가 서비스는 repository가 만든 응답을 그대로 반환한다', async () => {
  const repository = createSpacesRepositoryStub();
  const service = new SpacesService(repository);

  const result = await service.addSpaceMember('space-001', {
    userId: '22222222-2222-2222-2222-222222222222',
    role: 'MEMBER',
  });

  assert.equal(result.memberId, 'member-001');
  assert.equal(result.spaceId, 'space-001');
  assert.equal(result.userId, '22222222-2222-2222-2222-222222222222');
  assert.equal(result.role, 'MEMBER');
});

test('합주 공간 생성 서비스는 repository가 만든 응답을 그대로 반환한다', async () => {
  const repository = createSpacesRepositoryStub();
  const service = new SpacesService(repository);

  const result = await service.createBandSpace('band-001', {
    name: '3월 정기 합주',
    description: '정기 합주 준비',
    spaceType: 'STUDIO',
    status: 'ACTIVE',
    startDate: '2026-03-01',
    endDate: '2026-03-20',
  });

  assert.equal(result.spaceId, 'created-space-001');
  assert.equal(result.bandId, 'band-001');
  assert.equal(result.name, '3월 정기 합주');
  assert.equal(result.createdByUserId, 'user-001');
});

test('합주 공간 목록 조회 서비스는 repository 결과를 그대로 반환한다', async () => {
  const repository = createSpacesRepositoryStub();
  const service = new SpacesService(repository);

  const result = await service.getBandSpaces('band-001', {
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
  assert.equal(result.pagination.totalCount, 1);
  assert.equal(result.pagination.hasNext, false);
});

test('합주 공간 상세 조회 서비스는 공간 상세 정보와 멤버 목록을 반환한다', async () => {
  const repository = createSpacesRepositoryStub();
  const service = new SpacesService(repository);

  const result = await service.getSpaceDetail('space-001');

  assert.equal(result.space.spaceId, 'space-001');
  assert.equal(result.space.bandId, 'band-001');
  assert.equal(result.members.length, 2);
  assert.equal(result.members[0]?.nickname, '김민준');
  assert.equal(result.songCount, 3);
  assert.equal(result.scheduleCount, 2);
});

test('합주 공간 상세 조회 서비스는 공간이 없으면 NotFoundException을 던진다', async () => {
  const repository = createSpacesRepositoryStub();
  const service = new SpacesService(repository);

  await assert.rejects(async () => service.getSpaceDetail('space-missing'), NotFoundException);
});

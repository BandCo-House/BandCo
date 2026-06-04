import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import type { SpacesRepository } from './repositories/spaces.repository';
import { SPACES_REPOSITORY } from './repositories/spaces.repository';
import { SpacesService } from './spaces.service';

const repositoryStub: SpacesRepository = {
  async addSpaceMember(spaceId, input) {
    return {
      memberId: 'member-001',
      spaceId,
      bandMemberId: input.bandMemberId,
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
      description: input.description ?? '',
      spaceType: input.spaceType ?? 'ONLINE',
      status: input.status,
      startDate: input.startDate,
      endDate: input.endDate,
      createdByBandMemberId: 'band-member-001',
      createdAt: '2026-02-21T09:30:00.000Z',
    };
  },
  async findBandSpaces() {
    return {
      items: [
        {
          spaceId: 'space-001',
          bandId: 'band-001',
          createdByBandMemberId: 'band-member-001',
          name: '2026 하계공연 준비',
          description: '여름 축제 공연 준비 팀',
          spaceType: 'PERFORMANCE',
          status: 'ACTIVE',
          startDate: '2026-08-01',
          endDate: '2026-08-20',
          memberCount: 2,
          songCount: 3,
          isMine: true,
          myMembership: { isMember: true, role: 'LEADER' },
          createdAt: '2026-02-18T10:20:30.000Z',
          updatedAt: '2026-02-20T12:00:00.000Z',
        },
      ],
      pagination: { page: 1, size: 1, totalCount: 1, hasNext: false },
    };
  },
  async findDetailBySpaceId(spaceId) {
    if (spaceId !== 'space-001') return undefined;

    return {
      space: {
        spaceId: 'space-001',
        bandId: 'band-001',
        name: '2026 하계공연 준비',
        description: '여름 축제 공연 준비 팀',
        spaceType: 'PERFORMANCE',
        status: 'ACTIVE',
        startDate: '2026-08-01',
        endDate: '2026-08-20',
        createdAt: '2026-02-18T10:20:30.000Z',
        updatedAt: '2026-02-20T12:00:00.000Z',
      },
      members: [
        { bandMemberId: 'band-member-001', nickname: '김민준', role: 'LEADER', status: 'ACTIVE', joinedAt: '2026-02-18T10:21:00.000Z' },
        { bandMemberId: 'band-member-002', nickname: '이서연', role: 'MEMBER', status: 'ACTIVE', joinedAt: '2026-02-18T10:22:00.000Z' },
      ],
      songCount: 3,
      scheduleCount: 2,
    };
  },
};

describe('SpacesService', () => {
  let service: SpacesService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SpacesService, { provide: SPACES_REPOSITORY, useValue: repositoryStub }],
    }).compile();

    service = module.get(SpacesService);
  });

  describe('addSpaceMember', () => {
    it('repository 결과를 그대로 반환한다', async () => {
      const result = await service.addSpaceMember('space-001', {
        bandMemberId: '22222222-2222-2222-2222-222222222222',
        role: 'MEMBER',
      });

      expect(result.memberId).toBe('member-001');
      expect(result.spaceId).toBe('space-001');
      expect(result.bandMemberId).toBe('22222222-2222-2222-2222-222222222222');
      expect(result.role).toBe('MEMBER');
    });
  });

  describe('createBandSpace', () => {
    it('repository 결과를 그대로 반환한다', async () => {
      const result = await service.createBandSpace('band-001', {
        name: '3월 정기 합주',
        description: '정기 합주 준비',
        spaceType: 'PERFORMANCE',
        status: 'ACTIVE',
        startDate: '2026-03-01',
        endDate: '2026-03-20',
      });

      expect(result.spaceId).toBe('created-space-001');
      expect(result.bandId).toBe('band-001');
      expect(result.name).toBe('3월 정기 합주');
      expect(result.createdByBandMemberId).toBe('band-member-001');
    });
  });

  describe('getBandSpaces', () => {
    it('repository 결과를 그대로 반환한다', async () => {
      const result = await service.getBandSpaces('band-001', {
        query: '공연',
        onlyMine: undefined,
        inProgressOnly: true,
        page: 1,
        size: 1,
        sort: 'createdAt,asc',
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.spaceId).toBe('space-001');
      expect(result.pagination.totalCount).toBe(1);
    });
  });

  describe('getSpaceDetail', () => {
    it('공간이 존재하면 상세 정보를 반환한다', async () => {
      const result = await service.getSpaceDetail('space-001');

      expect(result.space.spaceId).toBe('space-001');
      expect(result.members).toHaveLength(2);
      expect(result.members[0]?.nickname).toBe('김민준');
      expect(result.songCount).toBe(3);
      expect(result.scheduleCount).toBe(2);
    });

    it('공간이 없으면 NotFoundException을 던진다', async () => {
      await expect(service.getSpaceDetail('space-missing')).rejects.toThrow(NotFoundException);
    });
  });
});

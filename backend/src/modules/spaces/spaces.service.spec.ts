import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { NotificationType } from '../../generated/prisma';
import { NotificationsService } from '../notifications/notifications.service';

import type { SpacesRepository } from './repositories/spaces.repository';
import { SPACES_REPOSITORY } from './repositories/spaces.repository';
import { SpacesService } from './spaces.service';

const repositoryStub: SpacesRepository = {
  async addSpaceMember(spaceId, input) {
    return {
      memberId: 'member-001',
      spaceId,
      userId: '11111111-1111-1111-1111-111111111111',
      bandMemberId: input.bandMemberId,
      role: input.role,
      status: 'ACTIVE',
      joinedAt: '2026-02-21T09:00:00.000Z',
      spaceName: '테스트 합주 공간',
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
  async findBandMemberUserIds() {
    return ['user-001', 'user-002'];
  },
  async updateBandSpace(spaceId, input) {
    return {
      spaceId,
      bandId: 'band-001',
      name: input.name ?? '기존 공간명',
      description: input.description ?? '',
      spaceType: input.spaceType ?? 'ONLINE',
      status: input.status ?? 'ACTIVE',
      startDate: input.startDate ?? '2026-08-01',
      endDate: input.endDate ?? '2026-08-20',
      updatedAt: '2026-05-29T10:00:00.000Z',
    };
  },
  async deleteBandSpace(spaceId) {
    return {
      spaceId,
      deletedAt: '2026-05-29T10:00:00.000Z',
    };
  },
  async updateSpaceMemberRole(spaceId, memberId, input) {
    return {
      memberId,
      spaceId,
      userId: '11111111-1111-1111-1111-111111111111',
      bandMemberId: 'band-member-001',
      role: input.role,
      spaceName: '테스트 합주 공간',
      updatedAt: '2026-05-29T10:00:00.000Z',
    };
  },
  async removeSpaceMember(spaceId, memberId) {
    return {
      memberId,
      spaceId,
      recipientUserId: '11111111-1111-1111-1111-111111111111',
      spaceName: '테스트 합주 공간',
      removedAt: '2026-05-29T10:00:00.000Z',
    };
  },
};

const notFoundRepositoryStub: Partial<SpacesRepository> = {
  async updateBandSpace() {
    throw new NotFoundException('요청한 합주 공간을 찾을 수 없습니다.');
  },
  async deleteBandSpace() {
    throw new NotFoundException('요청한 합주 공간을 찾을 수 없습니다.');
  },
  async updateSpaceMemberRole() {
    throw new NotFoundException('합주 공간 멤버를 찾을 수 없습니다.');
  },
  async removeSpaceMember() {
    throw new NotFoundException('합주 공간 멤버를 찾을 수 없습니다.');
  },
};

describe('SpacesService', () => {
  let service: SpacesService;
  let notificationsServiceMock: { createNotification: jest.Mock; createManyNotifications: jest.Mock };

  beforeEach(async () => {
    notificationsServiceMock = {
      createNotification: jest.fn().mockResolvedValue(undefined),
      createManyNotifications: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        SpacesService,
        { provide: SPACES_REPOSITORY, useValue: repositoryStub },
        { provide: NotificationsService, useValue: notificationsServiceMock },
      ],
    }).compile();

    service = module.get(SpacesService);
  });

  describe('addSpaceMember', () => {
    it('멤버 추가 결과를 반환하고 추가된 멤버에게 알림을 전송한다', async () => {
      const result = await service.addSpaceMember('space-001', {
        bandMemberId: '22222222-2222-2222-2222-222222222222',
        role: 'MEMBER',
      });

      expect(result.memberId).toBe('member-001');
      expect(result.spaceId).toBe('space-001');
      expect(result.userId).toBe('11111111-1111-1111-1111-111111111111');
      expect(result.role).toBe('MEMBER');
      expect(notificationsServiceMock.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: '11111111-1111-1111-1111-111111111111', type: NotificationType.NOTICE }),
      );
    });
  });

  describe('createBandSpace', () => {
    it('공간 생성 결과를 반환하고 밴드 멤버 전원에게 알림을 전송한다', async () => {
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
      expect(notificationsServiceMock.createManyNotifications).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ userId: 'user-001', type: NotificationType.NOTICE }),
          expect.objectContaining({ userId: 'user-002', type: NotificationType.NOTICE }),
        ]),
      );
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

  describe('updateBandSpace', () => {
    it('수정 결과를 반환한다', async () => {
      const result = await service.updateBandSpace('space-001', { name: '수정된 공간명' });

      expect(result.spaceId).toBe('space-001');
      expect(result.name).toBe('수정된 공간명');
    });

    it('공간이 없으면 NotFoundException을 전파한다', async () => {
      const module = await Test.createTestingModule({
        providers: [
          SpacesService,
          { provide: SPACES_REPOSITORY, useValue: { ...repositoryStub, ...notFoundRepositoryStub } },
          { provide: NotificationsService, useValue: notificationsServiceMock },
        ],
      }).compile();

      const notFoundService = module.get(SpacesService);

      await expect(notFoundService.updateBandSpace('space-missing', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteBandSpace', () => {
    it('삭제 결과(spaceId, deletedAt)를 반환한다', async () => {
      const result = await service.deleteBandSpace('space-001');

      expect(result.spaceId).toBe('space-001');
      expect(result.deletedAt).toBeDefined();
    });

    it('공간이 없으면 NotFoundException을 전파한다', async () => {
      const module = await Test.createTestingModule({
        providers: [
          SpacesService,
          { provide: SPACES_REPOSITORY, useValue: { ...repositoryStub, ...notFoundRepositoryStub } },
          { provide: NotificationsService, useValue: notificationsServiceMock },
        ],
      }).compile();

      const notFoundService = module.get(SpacesService);

      await expect(notFoundService.deleteBandSpace('space-missing')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSpaceMemberRole', () => {
    it('역할 수정 결과를 반환하고 해당 멤버에게 알림을 전송한다', async () => {
      const result = await service.updateSpaceMemberRole('space-001', 'member-001', { role: 'LEADER' });

      expect(result.memberId).toBe('member-001');
      expect(result.role).toBe('LEADER');
      expect(result.userId).toBe('11111111-1111-1111-1111-111111111111');
      expect(notificationsServiceMock.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: '11111111-1111-1111-1111-111111111111', type: NotificationType.NOTICE }),
      );
    });

    it('멤버가 없으면 NotFoundException을 전파한다', async () => {
      const module = await Test.createTestingModule({
        providers: [
          SpacesService,
          { provide: SPACES_REPOSITORY, useValue: { ...repositoryStub, ...notFoundRepositoryStub } },
          { provide: NotificationsService, useValue: notificationsServiceMock },
        ],
      }).compile();

      const notFoundService = module.get(SpacesService);

      await expect(notFoundService.updateSpaceMemberRole('space-001', 'member-missing', { role: 'LEADER' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeSpaceMember', () => {
    it('제거 결과(memberId, spaceId, removedAt)를 반환하고 해당 멤버에게 알림을 전송한다', async () => {
      const result = await service.removeSpaceMember('space-001', 'member-001');

      expect(result.memberId).toBe('member-001');
      expect(result.spaceId).toBe('space-001');
      expect(result.removedAt).toBeDefined();
      expect(notificationsServiceMock.createNotification).toHaveBeenCalledWith(
        expect.objectContaining({ userId: '11111111-1111-1111-1111-111111111111', type: NotificationType.NOTICE }),
      );
    });

    it('멤버가 없으면 NotFoundException을 전파한다', async () => {
      const module = await Test.createTestingModule({
        providers: [
          SpacesService,
          { provide: SPACES_REPOSITORY, useValue: { ...repositoryStub, ...notFoundRepositoryStub } },
          { provide: NotificationsService, useValue: notificationsServiceMock },
        ],
      }).compile();

      const notFoundService = module.get(SpacesService);

      await expect(notFoundService.removeSpaceMember('space-001', 'member-missing')).rejects.toThrow(NotFoundException);
    });
  });
});

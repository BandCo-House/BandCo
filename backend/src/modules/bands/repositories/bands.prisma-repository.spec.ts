import type { PrismaService } from '../../../database/prisma';

import { BandsPrismaRepository } from './bands.prisma-repository';

const mockCreatedAt = new Date('2026-04-10T12:00:00.000Z');

function createPrismaMock() {
  return {
    bandInvitation: {
      create: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    bandJoinRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    band: {
      findFirst: jest.fn(),
    },
    bandBlacklist: {
      findFirst: jest.fn(),
    },
    bandMember: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  };
}

describe('BandsPrismaRepository', () => {
  describe('findSentBandInvitations', () => {
    it('보낸 초대 목록을 상태와 커서 기준으로 조회하고 매핑한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findMany.mockResolvedValue([
        {
          id: 'invitation-001',
          message: '같이 합주해요!',
          status: 'PENDING',
          createdAt: mockCreatedAt,
          respondedAt: null,
          band: {
            id: 'band-001',
            name: 'Rocking Stars',
            description: '직장인 밴드',
            _count: {
              members: 5,
            },
          },
          inviteeUserId: 'user-002',
          inviteeUser: {
            profile: {
              nickname: 'Choi',
              avatarUrl: 'https://cdn.example.com/avatar.png',
            },
          },
        },
      ]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findSentBandInvitations('user-001', {
        where__invitation_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
      });

      expect(prisma.bandInvitation.findMany).toHaveBeenCalledWith({
        where: {
          status: 'PENDING',
          band: {
            deletedAt: null,
          },
          inviterBandMember: {
            userId: 'user-001',
          },
          inviteeUser: {
            deletedAt: null,
          },
        },
        include: {
          band: {
            include: {
              _count: {
                select: {
                  members: true,
                },
              },
            },
          },
          inviteeUser: {
            include: {
              profile: {
                select: {
                  nickname: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 21,
      });
      expect(result.items).toEqual([
        {
          invitationId: 'invitation-001',
          band: {
            bandId: 'band-001',
            name: 'Rocking Stars',
            description: '직장인 밴드',
            memberCount: 5,
          },
          invitee: {
            userId: 'user-002',
            nickname: 'Choi',
            avatarUrl: 'https://cdn.example.com/avatar.png',
          },
          invitationStatus: 'PENDING',
          message: '같이 합주해요!',
          createdAt: '2026-04-10T12:00:00.000Z',
          respondedAt: null,
        },
      ]);
      expect(result.meta).toEqual({
        count: 1,
        take: 20,
        cursor: {
          id: 'invitation-001',
        },
        next: null,
      });
    });

    it('cursor__id가 있으면 Prisma cursor와 skip을 사용한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findMany.mockResolvedValue([]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.findSentBandInvitations('user-001', {
        where__invitation_status: 'DECLINED',
        order__created_at: 'asc',
        order__id: 'asc',
        take: 10,
        cursor__id: 'invitation-001',
      });

      expect(prisma.bandInvitation.findMany).toHaveBeenCalledWith(expect.objectContaining({ cursor: { id: 'invitation-001' }, skip: 1 }));
    });

    it('take보다 많이 조회되면 next cursor를 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findMany.mockResolvedValue([
        {
          id: 'invitation-001',
          message: null,
          status: 'PENDING',
          createdAt: mockCreatedAt,
          respondedAt: null,
          band: { id: 'band-001', name: 'Rocking Stars', description: null, _count: { members: 5 } },
          inviteeUserId: 'user-002',
          inviteeUser: { profile: null },
        },
        {
          id: 'invitation-002',
          message: null,
          status: 'PENDING',
          createdAt: new Date('2026-04-09T12:00:00.000Z'),
          respondedAt: null,
          band: { id: 'band-002', name: 'Jazz Stars', description: null, _count: { members: 4 } },
          inviteeUserId: 'user-003',
          inviteeUser: { profile: null },
        },
      ]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findSentBandInvitations('user-001', {
        where__invitation_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 1,
      });

      expect(result.items).toHaveLength(1);
      expect(result.meta.next).toEqual({
        id: 'invitation-001',
      });
    });
  });

  describe('findSentBandJoinRequests', () => {
    it('보낸 가입 요청 목록을 상태와 커서 기준으로 조회하고 매핑한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandJoinRequest.findMany.mockResolvedValue([
        {
          id: 'join-request-001',
          message: '기타로 합류하고 싶습니다!',
          status: 'PENDING',
          createdAt: mockCreatedAt,
          band: {
            id: 'band-001',
            name: 'Rocking Stars',
            description: '직장인 밴드',
            visibility: true,
          },
        },
      ]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findSentBandJoinRequests('user-001', {
        where__join_request_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
      });

      expect(prisma.bandJoinRequest.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-001',
          status: 'PENDING',
          band: {
            deletedAt: null,
          },
        },
        include: {
          band: {
            select: {
              id: true,
              name: true,
              description: true,
              visibility: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 21,
      });
      expect(result.items).toEqual([
        {
          joinRequestId: 'join-request-001',
          band: {
            bandId: 'band-001',
            name: 'Rocking Stars',
            description: '직장인 밴드',
            visibility: true,
          },
          joinRequestStatus: 'PENDING',
          message: '기타로 합류하고 싶습니다!',
          createdAt: '2026-04-10T12:00:00.000Z',
        },
      ]);
      expect(result.meta).toEqual({
        count: 1,
        take: 20,
        cursor: {
          id: 'join-request-001',
        },
        next: null,
      });
    });

    it('cursor__id가 있으면 Prisma cursor와 skip을 사용한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandJoinRequest.findMany.mockResolvedValue([]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.findSentBandJoinRequests('user-001', {
        where__join_request_status: 'REJECTED',
        order__created_at: 'asc',
        order__id: 'asc',
        take: 10,
        cursor__id: 'join-request-001',
      });

      expect(prisma.bandJoinRequest.findMany).toHaveBeenCalledWith(expect.objectContaining({ cursor: { id: 'join-request-001' }, skip: 1 }));
    });

    it('take보다 많이 조회되면 next cursor를 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandJoinRequest.findMany.mockResolvedValue([
        {
          id: 'join-request-001',
          message: null,
          status: 'PENDING',
          createdAt: mockCreatedAt,
          band: { id: 'band-001', name: 'Rocking Stars', description: null, visibility: true },
        },
        {
          id: 'join-request-002',
          message: null,
          status: 'PENDING',
          createdAt: new Date('2026-04-09T12:00:00.000Z'),
          band: { id: 'band-002', name: 'Jazz Stars', description: null, visibility: false },
        },
      ]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findSentBandJoinRequests('user-001', {
        where__join_request_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 1,
      });

      expect(result.items).toHaveLength(1);
      expect(result.meta.next).toEqual({
        id: 'join-request-001',
      });
    });
  });

  describe('findReceivedBandInvitations', () => {
    it('받은 초대 목록을 상태와 커서 기준으로 조회하고 매핑한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findMany.mockResolvedValue([
        {
          id: 'invitation-001',
          message: '같이 밴드 하실래요?',
          status: 'PENDING',
          createdAt: mockCreatedAt,
          band: {
            id: 'band-001',
            name: 'Rocking Stars',
            description: '직장인 밴드',
          },
          inviterBandMember: {
            userId: 'user-001',
            user: {
              profile: {
                nickname: 'Jun',
              },
            },
          },
        },
      ]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findReceivedBandInvitations('user-002', {
        where__invitation_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 20,
      });

      expect(prisma.bandInvitation.findMany).toHaveBeenCalledWith({
        where: {
          inviteeUserId: 'user-002',
          status: 'PENDING',
          band: {
            deletedAt: null,
          },
          inviterBandMember: {
            user: {
              deletedAt: null,
            },
          },
        },
        include: {
          band: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
          inviterBandMember: {
            include: {
              user: {
                include: {
                  profile: {
                    select: {
                      nickname: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        take: 21,
      });
      expect(result.items).toEqual([
        {
          invitationId: 'invitation-001',
          band: {
            bandId: 'band-001',
            name: 'Rocking Stars',
            description: '직장인 밴드',
          },
          inviter: {
            userId: 'user-001',
            nickname: 'Jun',
          },
          message: '같이 밴드 하실래요?',
          invitationStatus: 'PENDING',
          createdAt: '2026-04-10T12:00:00.000Z',
        },
      ]);
      expect(result.meta).toEqual({
        count: 1,
        take: 20,
        cursor: {
          id: 'invitation-001',
        },
        next: null,
      });
    });

    it('cursor__id가 있으면 Prisma cursor와 skip을 사용한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findMany.mockResolvedValue([]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.findReceivedBandInvitations('user-002', {
        where__invitation_status: 'DECLINED',
        order__created_at: 'asc',
        order__id: 'asc',
        take: 10,
        cursor__id: 'invitation-001',
      });

      expect(prisma.bandInvitation.findMany).toHaveBeenCalledWith(expect.objectContaining({ cursor: { id: 'invitation-001' }, skip: 1 }));
    });

    it('take보다 많이 조회되면 next cursor를 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findMany.mockResolvedValue([
        {
          id: 'invitation-001',
          message: null,
          status: 'PENDING',
          createdAt: mockCreatedAt,
          band: { id: 'band-001', name: 'Rocking Stars', description: null },
          inviterBandMember: { userId: 'user-001', user: { profile: null } },
        },
        {
          id: 'invitation-002',
          message: null,
          status: 'PENDING',
          createdAt: new Date('2026-04-09T12:00:00.000Z'),
          band: { id: 'band-002', name: 'Jazz Stars', description: null },
          inviterBandMember: { userId: 'user-003', user: { profile: null } },
        },
      ]);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findReceivedBandInvitations('user-002', {
        where__invitation_status: 'PENDING',
        order__created_at: 'desc',
        order__id: 'desc',
        take: 1,
      });

      expect(result.items).toHaveLength(1);
      expect(result.meta.next).toEqual({
        id: 'invitation-001',
      });
    });
  });

  describe('acceptBandInvitation', () => {
    it('초대 상태를 수락으로 변경하고 밴드 멤버를 생성한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.update.mockResolvedValue({
        id: 'invitation-001',
        bandId: 'band-001',
        inviteeUserId: 'user-002',
        status: 'ACCEPTED',
      });
      prisma.bandMember.create.mockResolvedValue({
        joinedAt: new Date('2026-04-30T10:00:00.000Z'),
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);
      const respondedAt = new Date('2026-04-30T09:59:00.000Z');

      const result = await repository.acceptBandInvitation('invitation-001', 'band-001', 'user-002', respondedAt);

      expect(prisma.bandInvitation.update).toHaveBeenCalledWith({
        where: {
          id: 'invitation-001',
        },
        data: {
          status: 'ACCEPTED',
          respondedAt,
        },
        select: {
          id: true,
          bandId: true,
          inviteeUserId: true,
          status: true,
        },
      });
      expect(prisma.bandMember.create).toHaveBeenCalledWith({
        data: {
          bandId: 'band-001',
          userId: 'user-002',
          role: 'MEMBER',
        },
        select: {
          joinedAt: true,
        },
      });
      expect(result).toEqual({
        invitationId: 'invitation-001',
        bandId: 'band-001',
        userId: 'user-002',
        invitationStatus: 'ACCEPTED',
        joinedAt: '2026-04-30T10:00:00.000Z',
      });
    });

    it('tx가 있으면 tx client로 수락 처리한다', async () => {
      const prisma = createPrismaMock();
      const tx = createPrismaMock();
      tx.bandInvitation.update.mockResolvedValue({
        id: 'invitation-001',
        bandId: 'band-001',
        inviteeUserId: 'user-002',
        status: 'ACCEPTED',
      });
      tx.bandMember.create.mockResolvedValue({
        joinedAt: new Date('2026-04-30T10:00:00.000Z'),
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.acceptBandInvitation('invitation-001', 'band-001', 'user-002', new Date('2026-04-30T09:59:00.000Z'), tx as never);

      expect(tx.bandInvitation.update).toHaveBeenCalled();
      expect(tx.bandMember.create).toHaveBeenCalled();
      expect(prisma.bandInvitation.update).not.toHaveBeenCalled();
      expect(prisma.bandMember.create).not.toHaveBeenCalled();
    });
  });

  describe('declineBandInvitation', () => {
    it('초대 상태를 거절로 변경하고 응답 시각을 반환한다', async () => {
      const prisma = createPrismaMock();
      const respondedAt = new Date('2026-04-30T10:00:00.000Z');
      prisma.bandInvitation.update.mockResolvedValue({
        id: 'invitation-001',
        bandId: 'band-001',
        inviteeUserId: 'user-002',
        status: 'DECLINED',
        respondedAt,
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.declineBandInvitation('invitation-001', respondedAt);

      expect(prisma.bandInvitation.update).toHaveBeenCalledWith({
        where: {
          id: 'invitation-001',
        },
        data: {
          status: 'DECLINED',
          respondedAt,
        },
        select: {
          id: true,
          bandId: true,
          inviteeUserId: true,
          status: true,
          respondedAt: true,
        },
      });
      expect(result).toEqual({
        invitationId: 'invitation-001',
        bandId: 'band-001',
        userId: 'user-002',
        invitationStatus: 'DECLINED',
        respondedAt: '2026-04-30T10:00:00.000Z',
      });
    });

    it('tx가 있으면 tx client로 거절 처리한다', async () => {
      const prisma = createPrismaMock();
      const tx = createPrismaMock();
      const respondedAt = new Date('2026-04-30T10:00:00.000Z');
      tx.bandInvitation.update.mockResolvedValue({
        id: 'invitation-001',
        bandId: 'band-001',
        inviteeUserId: 'user-002',
        status: 'DECLINED',
        respondedAt,
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.declineBandInvitation('invitation-001', respondedAt, tx as never);

      expect(tx.bandInvitation.update).toHaveBeenCalled();
      expect(prisma.bandInvitation.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteBandInvitation', () => {
    it('초대 row를 삭제하고 invitationId를 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.delete.mockResolvedValue(undefined);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.deleteBandInvitation('invitation-001');

      expect(prisma.bandInvitation.delete).toHaveBeenCalledWith({
        where: {
          id: 'invitation-001',
        },
      });
      expect(result).toEqual({
        invitationId: 'invitation-001',
      });
    });

    it('tx가 있으면 tx client로 초대를 삭제한다', async () => {
      const prisma = createPrismaMock();
      const tx = createPrismaMock();
      tx.bandInvitation.delete.mockResolvedValue(undefined);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.deleteBandInvitation('invitation-001', tx as never);

      expect(tx.bandInvitation.delete).toHaveBeenCalled();
      expect(prisma.bandInvitation.delete).not.toHaveBeenCalled();
    });
  });

  describe('createBandInvitation', () => {
    it('밴드 초대를 생성하고 응답 필드로 매핑한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.create.mockResolvedValue({
        id: 'invitation-001',
        bandId: 'band-001',
        inviteeUserId: 'user-002',
        status: 'PENDING',
        createdAt: mockCreatedAt,
        inviterBandMember: {
          userId: 'user-001',
        },
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.createBandInvitation({
        bandId: 'band-001',
        inviterBandMemberId: 'band-member-001',
        inviteeUserId: 'user-002',
        message: '같이 밴드 하실래요?',
      });

      expect(prisma.bandInvitation.create).toHaveBeenCalledWith({
        data: {
          bandId: 'band-001',
          inviterBandMemberId: 'band-member-001',
          inviteeUserId: 'user-002',
          message: '같이 밴드 하실래요?',
        },
        select: {
          id: true,
          bandId: true,
          inviteeUserId: true,
          status: true,
          createdAt: true,
          inviterBandMember: {
            select: {
              userId: true,
            },
          },
        },
      });
      expect(result).toEqual({
        invitationId: 'invitation-001',
        bandId: 'band-001',
        inviterUserId: 'user-001',
        inviteeUserId: 'user-002',
        invitationStatus: 'PENDING',
        createdAt: '2026-04-10T12:00:00.000Z',
      });
    });

    it('tx가 있으면 tx client로 초대를 생성한다', async () => {
      const prisma = createPrismaMock();
      const tx = createPrismaMock();
      tx.bandInvitation.create.mockResolvedValue({
        id: 'invitation-001',
        bandId: 'band-001',
        inviteeUserId: 'user-002',
        status: 'PENDING',
        createdAt: mockCreatedAt,
        inviterBandMember: {
          userId: 'user-001',
        },
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.createBandInvitation(
        {
          bandId: 'band-001',
          inviterBandMemberId: 'band-member-001',
          inviteeUserId: 'user-002',
        },
        tx as never,
      );

      expect(tx.bandInvitation.create).toHaveBeenCalled();
      expect(prisma.bandInvitation.create).not.toHaveBeenCalled();
    });
  });

  describe('createBandJoinRequest', () => {
    it('밴드 가입 요청을 생성하고 응답 필드로 매핑한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandJoinRequest.create.mockResolvedValue({
        id: 'join-request-001',
        bandId: 'band-001',
        userId: 'user-002',
        status: 'PENDING',
        createdAt: mockCreatedAt,
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.createBandJoinRequest({
        bandId: 'band-001',
        userId: 'user-002',
        message: '기타로 합류하고 싶습니다!',
      });

      expect(prisma.bandJoinRequest.create).toHaveBeenCalledWith({
        data: {
          bandId: 'band-001',
          userId: 'user-002',
          message: '기타로 합류하고 싶습니다!',
        },
        select: {
          id: true,
          bandId: true,
          userId: true,
          status: true,
          createdAt: true,
        },
      });
      expect(result).toEqual({
        joinRequestId: 'join-request-001',
        bandId: 'band-001',
        userId: 'user-002',
        joinRequestStatus: 'PENDING',
        createdAt: '2026-04-10T12:00:00.000Z',
      });
    });

    it('tx가 있으면 tx client로 가입 요청을 생성한다', async () => {
      const prisma = createPrismaMock();
      const tx = createPrismaMock();
      tx.bandJoinRequest.create.mockResolvedValue({
        id: 'join-request-001',
        bandId: 'band-001',
        userId: 'user-002',
        status: 'PENDING',
        createdAt: mockCreatedAt,
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      await repository.createBandJoinRequest(
        {
          bandId: 'band-001',
          userId: 'user-002',
        },
        tx as never,
      );

      expect(tx.bandJoinRequest.create).toHaveBeenCalled();
      expect(prisma.bandJoinRequest.create).not.toHaveBeenCalled();
    });
  });

  describe('findBandForJoinRequest', () => {
    it('삭제되지 않은 밴드의 공개 상태를 조회한다', async () => {
      const prisma = createPrismaMock();
      prisma.band.findFirst.mockResolvedValue({
        id: 'band-001',
        visibility: true,
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandForJoinRequest('band-001');

      expect(prisma.band.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'band-001',
          deletedAt: null,
        },
        select: {
          id: true,
          visibility: true,
        },
      });
      expect(result).toEqual({
        id: 'band-001',
        visibility: true,
      });
    });
  });

  describe('findBandJoinRequestByBandIdAndUserId', () => {
    it('밴드와 사용자 기준으로 기존 가입 요청을 조회한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandJoinRequest.findFirst.mockResolvedValue({
        id: 'join-request-001',
        status: 'PENDING',
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandJoinRequestByBandIdAndUserId('band-001', 'user-002');

      expect(prisma.bandJoinRequest.findFirst).toHaveBeenCalledWith({
        where: {
          bandId: 'band-001',
          userId: 'user-002',
        },
        select: {
          id: true,
          status: true,
        },
      });
      expect(result).toEqual({
        id: 'join-request-001',
        status: 'PENDING',
      });
    });
  });

  describe('findBandInvitationByBandIdAndInviteeUserId', () => {
    it('밴드와 초대 대상 기준으로 기존 초대를 조회한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findFirst.mockResolvedValue({
        id: 'invitation-001',
        status: 'PENDING',
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandInvitationByBandIdAndInviteeUserId('band-001', 'user-002');

      expect(prisma.bandInvitation.findFirst).toHaveBeenCalledWith({
        where: {
          bandId: 'band-001',
          inviteeUserId: 'user-002',
        },
        select: {
          id: true,
          status: true,
        },
      });
      expect(result).toEqual({
        id: 'invitation-001',
        status: 'PENDING',
      });
    });
  });

  describe('findBandInvitationForResponse', () => {
    it('삭제되지 않은 밴드의 초대만 조회한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findFirst.mockResolvedValue({
        id: 'invitation-001',
        bandId: 'band-001',
        inviteeUserId: 'user-002',
        status: 'PENDING',
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandInvitationForResponse('invitation-001');

      expect(prisma.bandInvitation.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'invitation-001',
          band: {
            deletedAt: null,
          },
        },
        select: {
          id: true,
          bandId: true,
          inviteeUserId: true,
          status: true,
        },
      });
      expect(result).toEqual({
        id: 'invitation-001',
        bandId: 'band-001',
        inviteeUserId: 'user-002',
        status: 'PENDING',
      });
    });
  });

  describe('findBandInvitationForDelete', () => {
    it('삭제되지 않은 밴드의 초대와 초대한 사용자 ID를 조회한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findFirst.mockResolvedValue({
        id: 'invitation-001',
        status: 'PENDING',
        inviterBandMember: {
          userId: 'user-001',
        },
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandInvitationForDelete('invitation-001');

      expect(prisma.bandInvitation.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'invitation-001',
          band: {
            deletedAt: null,
          },
        },
        select: {
          id: true,
          status: true,
          inviterBandMember: {
            select: {
              userId: true,
            },
          },
        },
      });
      expect(result).toEqual({
        id: 'invitation-001',
        status: 'PENDING',
        inviterUserId: 'user-001',
      });
    });

    it('초대가 없으면 null을 반환한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandInvitation.findFirst.mockResolvedValue(null);
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandInvitationForDelete('invitation-missing');

      expect(result).toBeNull();
    });
  });

  describe('findBandBlacklistByBandIdAndUserId', () => {
    it('밴드와 사용자 기준으로 차단 정보를 조회한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandBlacklist.findFirst.mockResolvedValue({
        id: 'blacklist-001',
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandBlacklistByBandIdAndUserId('band-001', 'user-002');

      expect(prisma.bandBlacklist.findFirst).toHaveBeenCalledWith({
        where: {
          bandId: 'band-001',
          userId: 'user-002',
        },
        select: {
          id: true,
        },
      });
      expect(result).toEqual({
        id: 'blacklist-001',
      });
    });
  });

  describe('findBandMemberByBandIdAndUserId', () => {
    it('밴드 멤버 역할까지 조회한다', async () => {
      const prisma = createPrismaMock();
      prisma.bandMember.findFirst.mockResolvedValue({
        id: 'band-member-001',
        userId: 'user-001',
        role: 'BM',
      });
      const repository = new BandsPrismaRepository(prisma as unknown as PrismaService);

      const result = await repository.findBandMemberByBandIdAndUserId('band-001', 'user-001');

      expect(prisma.bandMember.findFirst).toHaveBeenCalledWith({
        where: {
          bandId: 'band-001',
          userId: 'user-001',
        },
        select: {
          id: true,
          userId: true,
          role: true,
        },
      });
      expect(result).toEqual({
        id: 'band-member-001',
        userId: 'user-001',
        role: 'BM',
      });
    });
  });
});
